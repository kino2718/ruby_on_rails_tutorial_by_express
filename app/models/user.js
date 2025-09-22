const knex_utils = require('../db/knex_utils')
const knex = knex_utils.knex
const debugLog = knex_utils.debugLog
const RecordBase = require('./record_base')

class User extends RecordBase {
    id // 自動で割り振られる。user.id = 3 等の id の手動での変更は save 時にエラーになる。変更しないこと
    name
    email
    created_at // 自動で割り振られる
    updated_at // 自動で割り振られる

    constructor(params = {}) {
        super()
        this.name = params.name
        this.email = params.email
        this.password = params.password
        this.password_confirmation = params.password_confirmation
    }

    static #userInputParams(params) {
        return {
            name: params.name, email: params.email,
            password: params.password, password_confirmation: params.password_confirmation
        }
    }

    #paramsToDB() {
        return { name: this.name, email: this.email }
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
        if (!User.#presence(this.password)) {
            v = false
            this.errors.push("password can't be blank")
        }

        // password_confirmation presence
        if (!User.#presence(this.password_confirmation)) {
            v = false
            this.errors.push("password_confirmation can't be blank")
        }

        // password and password_confirmation must be equal
        if (this.password !== this.password_confirmation) {
            v = false
            this.errors.push("password confirmation doesn't match password")
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
            const params2 = User.#userInputParams(params)
            Object.assign(this, params2)
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
            Object.assign(this, u)
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    dup() {
        const u = new User()
        return Object.assign(u, User.#userInputParams(this))
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

    static #presence(str) {
        return (str && str.trim())
    }

    static #valid_length(str, conds) {
        if (conds.maximum) {
            return str.length <= conds.maximum
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
