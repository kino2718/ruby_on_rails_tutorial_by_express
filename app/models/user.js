const knex_utils = require('../db/knex_utils')
const knex = knex_utils.knex
const debugLog = knex_utils.debugLog
const bcrypt = require('bcryptjs')
const RecordBase = require('./record_base')

const SALT_ROUNDS = 12 // hash化でのsaltRounds。Railsでは12


class User extends RecordBase {
    id // 自動で割り振られる。user.id = 3 等の id の手動での変更は save 時にエラーになる。変更しないこと
    name
    email
    // 以下password関連のpropertyはprivateとする。これでログ等には出力されなくなる。
    // デバッグ用にgetter methodを定義しておく
    #password
    #password_confirmation
    #password_digest
    created_at // 自動で割り振られる
    updated_at // 自動で割り振られる

    constructor(params = {}) {
        super()
        this.name = params.name
        this.email = params.email
        this.#password = params.password
        this.#password_confirmation = params.password_confirmation
    }

    // password関連のpropertyのgetter, setter methods
    // デバッグやテスト用に定義しておく
    get password() {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!");
        }
        return this.#password
    }

    set password(p) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!");
        }
        this.#password = p
    }

    get password_confirmation() {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!");
        }
        return this.#password_confirmation
    }

    set password_confirmation(p) {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!");
        }
        this.#password_confirmation = p
    }

    get password_digest() {
        if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
            throw new Error("Accessing password is not allowed outside development or test!");
        }
        return this.#password_digest
    }

    valid() {
        this.errors = []
        let v = true
        // name presence
        if (!User.#presence(this.name)) {
            v = false
            this.errors.push("name can't be blank")
        }
        // name length
        if (!User.#valid_length(this.name, { maximum: 50 })) {
            v = false
            this.errors.push('name is too long')
        }

        // email presence
        if (!User.#presence(this.email)) {
            v = false
            this.errors.push("email can't be blank")
        }
        // email length
        if (!User.#valid_length(this.email, { maximum: 255 })) {
            v = false
            this.errors.push('email is too long')
        }
        // email format
        const VALID_EMAIL_REGEX = /^[\w+\-.]+@[a-z\d\-.]+\.[a-z]+$/i
        if (!User.#valid_format(this.email, { with: VALID_EMAIL_REGEX })) {
            v = false
            this.errors.push('email is invalid')
        }

        // password presence
        if (!User.#presence(this.#password)) {
            v = false
            this.errors.push("password can't be blank")
        }

        // password_confirmation presence
        if (!User.#presence(this.#password_confirmation)) {
            v = false
            this.errors.push("password_confirmation can't be blank")
        }

        // password and password_confirmation must be equal
        if (this.#password !== this.#password_confirmation) {
            v = false
            this.errors.push("password confirmation doesn't match password")
        }

        // password length
        if (!User.#valid_length(this.#password, { minimum: 6 })) {
            v = false
            this.errors.push("password is too short")
        }

        if (v) this.errors = undefined
        return v
    }

    async validAsync() {
        this.asyncErrors = []
        let v = true

        // email uniqueness
        if (! await User.#uniqueness({ email: this.email })) {
            v = false
            this.asyncErrors.push('email has already been taken')
        }

        if (v) this.asyncErrors = undefined
        return v
    }

    async save() {
        if (!this.valid()) return false

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
            if ('password_confirmation' in params) this.#password_confirmation = params.password_confirmation
            if (!this.valid()) return false

            return this.#update()
        } else {
            return false
        }
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
        const hash = bcrypt.hashSync(this.#password, SALT_ROUNDS)
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
            const password_digest = u.password_digest
            delete u.password_digest
            Object.assign(this, u)
            this.#password_digest = password_digest
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    authenticate(password) {
        if (!password || !this.#password_digest) return false
        return bcrypt.compareSync(password, this.#password_digest)
    }

    dup() {
        const u = new User()
        u.name = this.name
        u.email = this.email
        u.#password = this.#password
        u.#password_confirmation = this.#password_confirmation
        u.#password_digest = this.#password_digest
        return u
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
            return knex('users').select('*').where('id', id).first()
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async findBy(params = {}) {
        try {
            return knex('users').select('*').where(params)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async first() {
        return knex('users').select('*').orderBy('id', 'asc').limit(1).first()
    }

    static async all() {
        return knex('users').select('*').orderBy('id', 'asc')
    }

    static async count() {
        const { count } = await knex('users').count('* as count').first()
        // 文字列の可能性があるので Number に変換
        return Number(count);
    }

    static #presence(str) {
        return (str && str.trim())
    }

    static #valid_length(str, conds) {
        if (!str) return false

        if (conds.maximum) {
            return str.length <= conds.maximum
        }
        if (conds.minimum) {
            return conds.minimum <= str.length
        }
        return true
    }

    static #valid_format(str, conds) {
        if (conds.with) {
            return conds.with.test(str)
        }
    }

    static async #uniqueness(conds) {
        if (conds.email) conds.email = conds.email.toLowerCase()
        const temp = await User.findBy(conds)
        return temp.length == 0
    }
}

module.exports = User
