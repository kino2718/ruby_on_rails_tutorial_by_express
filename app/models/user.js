const knexUtils = require('../db/knex_utils')
const knex = knexUtils.knex
const debugLog = knexUtils.debugLog
const bcrypt = require('bcryptjs')
const RecordBase = require('./record_base')
const uid = require('uid-safe')

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
    createdAt // 自動で割り振られる
    updatedAt // 自動で割り振られる

    constructor(params = {}) {
        super()
        this.name = params.name
        this.email = params.email
        this.#password = params.password
        this.#passwordConfirmation = params.passwordConfirmation
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

    async valid() {
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
        if (!User.#presence(this.#password)) {
            v = false
            props.push('password')
            messages.push("password can't be blank")
        }

        // passwordConfirmation presence
        if (!User.#presence(this.#passwordConfirmation)) {
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
        if (!User.#validLength(this.#password, { minimum: 6 })) {
            v = false
            props.push('password')
            messages.push("password is too short")
        }

        // email uniquness
        if (! await User.#uniqueness({ email: this.email })) {
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

    async save() {
        if (!await this.valid()) return false

        if (this.newRecord) {
            // insert
            return this.#insert()
        } else if (this.persisted) {
            // update
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
            if (!await this.valid()) return false

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
            this.email = this.email.toLowerCase()
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
            this.email = this.email.toLowerCase()
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
        // passwordをhash化する
        const hash = User.digest(this.#password)
        return { name: this.name, email: this.email, password_digest: hash }
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
        const u = new User()
        u.name = this.name
        u.email = this.email
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

    isAuthenticated(rememberToken) {
        if (!rememberToken || !this.rememberDigest) return false
        return bcrypt.compareSync(rememberToken, this.rememberDigest)
    }

    async forget() {
        await this.updateAttribute('remember_digest', null)
    }

    async destroy() {
        if (this.persisted) {
            try {
                await knex('users').where({ id: this.id }).del()
                this.setDestroyed()
            } catch (e) {
                console.error(e)
            }
        }
        return this
    }

    // static methods
    static async create(params = {}) {
        const user = new User(params)
        if (user.save()) {
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

    static #dbToUserObject(obj) {
        if (obj) {
            const u = new User()
            u.id = obj.id
            u.name = obj.name
            u.email = obj.email
            u.createdAt = obj.created_at
            u.updatedAt = obj.updated_at
            u.#passwordDigest = obj.password_digest
            u.rememberDigest = obj.remember_digest
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

    static async #uniqueness(conds) {
        if (conds.email) conds.email = conds.email.toLowerCase()
        const temp = await User.findBy(conds)
        return temp.length == 0
    }

    static digest(str) {
        const SALT_ROUNDS = 12 // hash化でのsaltRounds。Railsでは12
        return bcrypt.hashSync(str, SALT_ROUNDS)
    }

    static async newToken() {
        return await uid(16)
    }
}

module.exports = User
