const knexUtils = require('../db/knex_utils')
const knex = knexUtils.knex
const debugLog = knexUtils.debugLog
const bcrypt = require('bcryptjs')
const RecordBase = require('./record_base')
const uid = require('uid-safe')
const userMailer = require('../mailers/user_mailer')
const Micropost = require('./micropost')
const Relationship = require('./relationship')

class User extends RecordBase {
    id // 自動で割り振られる。user.id = 3 等の id の手動での変更は save 時にエラーになる。変更しないこと
    name
    email
    // 以下password関連のpropertyはprivateとする。これでログ等には出力されなくなる。
    // デバッグ用にgetter methodを定義しておく
    #password
    #passwordConfirmation
    #passwordDigest
    rememberToken
    rememberDigest // Railsでは普通に表示されるのでprivateにしない。
    admin
    createdAt // 自動で割り振られる
    updatedAt // 自動で割り振られる
    // activationToken // #reloadでundefinedになってしまうのでプロパティから外す
    activationDigest
    activated
    activatedAt
    resetDigest
    resetSentAt

    constructor(params = {}) {
        super()
        this.name = params.name
        this.email = params.email
        this.#password = params.password
        this.#passwordConfirmation = params.passwordConfirmation
        this.admin = params.admin
        this.activated = params.activated
        this.activatedAt = params.activatedAt
        this.resetSentAt = params.resetSentAt

        // micropostとの関連付け
        const self = this // thisは何を指すかが変わるのでselfに固定する
        const micropostsFunc = async function () {
            return await Micropost.findBy({ userId: self.id })
        }
        micropostsFunc.build = function (params = {}) {
            params.userId = self.id
            return new Micropost(params)
        }
        micropostsFunc.create = async function (params = {}) {
            params.userId = self.id
            return await Micropost.create(params)
        }
        micropostsFunc.count = async function () {
            const options = { where: { userId: self.id } }
            return await Micropost.count(options)
        }
        micropostsFunc.paginate = async function (perPage, offset) {
            const options = { where: { userId: self.id } }
            return await Micropost.paginate(perPage, offset, options)
        }
        micropostsFunc.findBy = async function (params = {}) {
            params.userId = self.id
            return await Micropost.findBy(params)
        }
        this.microposts = micropostsFunc

        // activeRelationships関連
        const activeRelationships = async function () {
            return await Relationship.findBy({ followerId: self.id })
        }
        activeRelationships.build = function (params = {}) {
            params.followerId = self.id
            return new Relationship(params)
        }
        activeRelationships.create = async function (params = {}) {
            params.followerId = self.id
            return await Relationship.create(params)
        }
        this.activeRelationships = activeRelationships

        // passiveRelationships関連
        const passiveRelationships = async function () {
            return await Relationship.findBy({ followedId: self.id })
        }
        this.passiveRelationships = passiveRelationships

        // following関連
        const following = async function () {
            const rels = await activeRelationships()
            const ret = []
            for (const r of rels) {
                ret.push(await r.followed())
            }
            return ret
        }
        following.include = async function (otherUser) {
            const ret = await Relationship.findBy({ followerId: self.id, followedId: otherUser.id })
            return 0 < ret.length
        }
        following.add = async function (otherUser) {
            const ret = await Relationship.create({ followerId: self.id, followedId: otherUser.id })
            return !!ret
        }
        following.delete = async function (otherUser) {
            const rels = await Relationship.findBy({ followerId: self.id, followedId: otherUser.id })
            const rel = rels?.at(0)
            if (rel) {
                await rel.destroy()
                return true
            } else return false
        }
        following.count = async function () {
            return await Relationship.count({ followerId: self.id })
        }
        this.following = following

        // followers関連
        const followers = async function () {
            const rels = await passiveRelationships()
            const ret = []
            for (const r of rels) {
                ret.push(await r.follower())
            }
        }
        followers.include = async function (otherUser) {
            const ret = await Relationship.findBy({ followedId: self.id, followerId: otherUser.id })
            return 0 < ret.length
        }
        followers.count = async function () {
            return await Relationship.count({ followedId: self.id })
        }
        this.followers = followers
    }

    // password関連のpropertyのgetter, setter methods
    // デバッグやテスト用に定義しておく
    get password() {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!")
        }
        return this.#password
    }

    set password(p) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!")
        }
        this.#password = p
    }

    get passwordConfirmation() {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!")
        }
        return this.#passwordConfirmation
    }

    set passwordConfirmation(p) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!")
        }
        this.#passwordConfirmation = p
    }

    get passwordDigest() {
        return this.#passwordDigest
    }

    async valid(allowEmptyPassword = false) {
        const props = []
        const messages = []
        let v = true
        // name presence
        if (!User.#presence(this.name)) {
            v = false
            props.push('name')
            messages.push("name can't be blank")
        }
        // name length
        if (!User.#validLength(this.name, { maximum: 50 })) {
            v = false
            props.push('name')
            messages.push('name is too long')
        }

        // email presence
        if (!User.#presence(this.email)) {
            v = false
            props.push('email')
            messages.push("email can't be blank")
        }
        // email length
        if (!User.#validLength(this.email, { maximum: 255 })) {
            v = false
            props.push('email')
            messages.push('email is too long')
        }
        // email format
        const VALID_EMAIL_REGEX = /^[\w+\-.]+@[a-z\d\-.]+\.[a-z]+$/i
        if (!User.#validFormat(this.email, { with: VALID_EMAIL_REGEX })) {
            v = false
            props.push('email')
            messages.push('email is invalid')
        }

        // password presence
        if (!(allowEmptyPassword || User.#presence(this.#password))) {
            v = false
            props.push('password')
            messages.push("password can't be blank")
        }

        // passwordConfirmation presence
        if (!(allowEmptyPassword || User.#presence(this.#passwordConfirmation))) {
            v = false
            props.push('passwordConfirmation')
            messages.push("password confirmation can't be blank")
        }

        // password and passwordConfirmation must be equal
        if (this.#password !== this.#passwordConfirmation) {
            v = false
            props.push('passwordConfirmation')
            messages.push("password confirmation doesn't match password")
        }

        // password length
        if (!((allowEmptyPassword && !User.#presence(this.#password)) || User.#validLength(this.#password, { minimum: 6 }))) {
            v = false
            props.push('password')
            messages.push("password is too short")
        }

        // email uniquness
        if (! await this.#uniqueness({ email: this.email })) {
            v = false
            props.push('email')
            messages.push('email has already been taken')
        }

        if (v) {
            this.errors = undefined
        }
        else {
            this.errors = {}
            this.errors.fullMessages = messages
            this.errors.props = props
        }
        return v
    }

    addError(prop, message) {
        if (!this.errors) this.errors = { props: [], fullMessages: [] }
        this.errors.props.push(prop)
        this.errors.fullMessages.push(message)
    }

    async save() {
        if (this.newRecord) {
            // insert
            if (!await this.valid()) return false
            return this.#insert()
        } else if (this.persisted) {
            // update
            if (!await this.valid(true)) return false
            return this.#update()
        } else {
            // 破棄済み。何もしない
            return false
        }
    }

    async update(params = {}) {
        if (this.persisted) {
            if ('name' in params) this.name = params.name
            if ('email' in params) this.email = params.email
            if ('password' in params) this.#password = params.password
            if ('passwordConfirmation' in params) this.#passwordConfirmation = params.passwordConfirmation
            if ('admin' in params) this.admin = params.admin
            if ('activated' in params) this.activated = params.activated
            if ('activatedAt' in params) this.activatedAt = params.activatedAt
            if ('resetDigest' in params) this.resetDigest = params.resetDigest
            if ('resetSentAt' in params) this.resetSentAt = params.resetSentAt
            if (!await this.valid(true)) return false

            return this.#update()
        } else {
            return false
        }
    }

    async updateAttribute(key, value) {
        if (this.persisted) {
            try {
                if (key === 'email') value = value.toLowerCase()
                if (key === 'rememberDigest') key = 'remember_digest'
                if (key === 'activatedAt') key = 'activated_at'
                if (key === 'resetDigest') key = 'reset_digest'
                if (key === 'resetSentAt') key = 'reset_sent_at'
                const params = { [key]: value }
                const [res] = await knex('users')
                    .where('id', this.id)
                    .update({ ...params, updated_at: knex.fn.now() }) // updated_at はデータベース側で更新
                    .returning('id')
                await this.#reload(res.id)
                this.setSaved()
                debugLog(this)
                return true
            } catch (e) {
                console.error(e)
                return false
            }
        }
        return false
    }

    async #insert() {
        try {
            User.#downcaseEmail(this)
            await this.#createActivationDigest()
            const params = this.#paramsToDB()
            const [res] = await knex('users').insert(params).returning('id')
            await this.#reload(res.id)
            this.setSaved()
            debugLog(this)
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async #update() {
        try {
            User.#downcaseEmail(this)
            const params = this.#paramsToDB()
            const [res] = await knex('users')
                .where('id', this.id)
                .update({ ...params, updated_at: knex.fn.now() }) // updated_at はデータベース側で更新
                .returning('id')
            await this.#reload(res.id)
            this.setSaved()
            debugLog(this)
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    #paramsToDB() {
        const toDB = {
            name: this.name, email: this.email, admin: !!this.admin,
            activation_digest: this.activationDigest, activated: this.activated, activated_at: this.activatedAt,
            reset_digest: this.resetDigest, reset_sent_at: this.resetSentAt
        }

        if (User.#presence(this.#password)) {
            // passwordをhash化する
            const hash = User.digest(this.#password)
            toDB.password_digest = hash
        }
        return toDB
    }

    async reload() {
        if (this.persisted) {
            await this.#reload(this.id)
        }
        return this
    }

    async #reload(id) {
        try {
            const u = await User.find(id)
            if (!u) return false
            const passwordDigest = u.passwordDigest
            delete u.passwordDigest
            Object.assign(this, u)
            this.#passwordDigest = passwordDigest
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    authenticate(password) {
        if (!password || !this.#passwordDigest) return false
        return bcrypt.compareSync(password, this.#passwordDigest)
    }

    dup() {
        // id 以外はコピーする
        const u = new User()
        Object.assign(u, this)
        u.id = undefined
        // private propertyをコピーする
        u.#password = this.#password
        u.#passwordConfirmation = this.#passwordConfirmation
        u.#passwordDigest = this.#passwordDigest
        return u
    }

    async remember() {
        const rememberToken = await User.newToken()
        await this.updateAttribute('rememberDigest', User.digest(rememberToken))
        this.rememberToken = rememberToken
    }

    isAuthenticated(attribute, token) {
        const digest = this[`${attribute}Digest`]
        if (!digest) return false
        return bcrypt.compareSync(token, digest)
    }

    async forget() {
        await this.updateAttribute('remember_digest', null)
    }

    async destroy() {
        if (this.persisted) {
            try {
                // まずmicropostsを削除する。databaseでon delete cascadeしているので
                // 自動的に消えるがmicropostに所属する画像ファイルも最終的に消したいので
                // 明示的にmicropostsを削除する。
                for (const m of await this.microposts()) {
                    await m.destroy()
                }
                await knex('users').where({ id: this.id }).del()
                this.setDestroyed()
            } catch (e) {
                console.error(e)
            }
        }
        return this
    }

    async #uniqueness(conds) {
        const temp = await User.findBy(conds)
        if (temp.length == 0) return true
        else if (temp.length == 1) {
            return temp.id !== this.id
        }
        return false
    }

    async #createActivationDigest() {
        this.activationToken = await User.newToken()
        this.activationDigest = User.digest(this.activationToken)
    }

    async activate() {
        await this.updateAttribute('activated', true)
        await this.updateAttribute('activatedAt', knex.fn.now())
    }

    async sendActivationEmail(url) {
        const mail = await userMailer.accountActivation(this, url)
        await userMailer.deliverNow(mail)
    }

    async createResetDigest() {
        this.resetToken = await User.newToken()
        this.resetDigest = User.digest(this.resetToken)
        await this.updateAttribute('resetDigest', this.resetDigest)
        await this.updateAttribute('resetSentAt', knex.fn.now())
    }

    async sendPasswordResetEmail(url) {
        const mail = await userMailer.passwordReset(this, url)
        await userMailer.deliverNow(mail)
    }

    isPasswordResetExpired() {
        // this.resetSentAt が Date または string のどちらでもOKにする
        const t = this.resetSentAt
        const resetSentAt = t instanceof Date ? t : new Date(t.endsWith('Z') ? t : t + 'Z')
        // 現在時刻との差（ミリ秒）
        const diffMs = Date.now() - resetSentAt.getTime()
        // 2時間（7200000ミリ秒）以上前か？
        const isOver2Hours = 2 * 60 * 60 * 1000 < diffMs
        return isOver2Hours
    }

    // perPage = undefined: no paginate
    async feed(perPage, offset) {
        return await Micropost.paginate(perPage, offset, { where: { userId: this.id } })
    }

    async feedCount() {
        return await Micropost.count({ where: { userId: this.id } })
    }

    async follow(otherUser) {
        if (this.id !== otherUser.id) await this.following.add(otherUser)
    }

    async unfollow(otherUser) {
        await this.following.delete(otherUser)
    }

    async isFollowing(otherUser) {
        return await this.following.include(otherUser)
    }

    // static methods
    static async create(params = {}) {
        const user = new User(params)
        if (await user.save()) {
            return user
        } else {
            return null
        }
    }

    static async find(id) {
        try {
            const obj = await knex('users').select('*').where('id', id).first()
            return User.#dbToUserObject(obj)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async findBy(params = {}) {
        try {
            User.#downcaseEmail(params)
            const li = await knex('users').select('*').where(params)
            return li.map(o => User.#dbToUserObject(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async first() {
        try {
            const obj = await knex('users').select('*').orderBy('id', 'asc').limit(1).first()
            return User.#dbToUserObject(obj)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async take(n, options = { order: { column: 'id', direction: 'asc' } }) {
        try {
            const li = await knex('users').select('*')
                .orderBy(options.order.column, options.order.direction)
                .limit(n)
            return li.map(o => User.#dbToUserObject(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static #dbToUserObject(obj) {
        if (obj) {
            const u = new User()
            u.id = obj.id
            u.name = obj.name
            u.email = obj.email
            u.#passwordDigest = obj.password_digest
            u.rememberDigest = obj.remember_digest
            u.admin = obj.admin
            u.createdAt = obj.created_at
            u.updatedAt = obj.updated_at
            u.activationDigest = obj.activation_digest
            u.activated = obj.activated
            u.activatedAt = obj.activated_at
            u.resetDigest = obj.reset_digest
            u.resetSentAt = obj.reset_sent_at
            u.setSaved() // このidのuserは既にdbに存在するため
            return u
        } else {
            return null
        }
    }

    static async all() {
        try {
            const li = await knex('users').select('*').orderBy('id', 'asc')
            return li.map(o => User.#dbToUserObject(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async paginate(perPage, offset) {
        try {
            const li = await knex('users').select('*').orderBy('id', 'asc').limit(perPage).offset(offset)
            return li.map(o => User.#dbToUserObject(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async count() {
        const { count } = await knex('users').count('* as count').first()
        // 文字列の可能性があるので Number に変換
        return Number(count)
    }

    static #presence(str) {
        return (str && str.trim())
    }

    static #validLength(str, conds) {
        if (conds.maximum) {
            if (!str) return true
            return str.length <= conds.maximum
        }
        if (conds.minimum) {
            if (!str) return false
            return conds.minimum <= str.length
        }
        return true
    }

    static #validFormat(str, conds) {
        if (conds.with) {
            return conds.with.test(str)
        }
    }

    static digest(str) {
        const SALT_ROUNDS = 12 // hash化でのsaltRounds。Railsでは12
        return bcrypt.hashSync(str, SALT_ROUNDS)
    }

    static async newToken() {
        return await uid(16)
    }

    static #downcaseEmail(o) {
        if (o.email) {
            o.email = o.email.toLowerCase()
        }
    }
}

module.exports = User
