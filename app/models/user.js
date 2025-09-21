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
        if (!User.#length(this.name, {maximum: 50})) {
            v = false
            this.errors.push('name is too long')
        }

        // email presence
        if (!User.#presence(this.email)) {
            v = false
            this.errors.push("email can't be blank")
        }
        // email length
        if (!User.#length(this.email, {maximum: 255})) {
            v = false
            this.errors.push('email is too long')
        }

        if (v) this.errors = undefined
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
            const attrs = { name: params.name, email: params.email }
            Object.assign(this, attrs)
            if (!this.valid()) return false

            return this.#update()
        } else {
            return false
        }
    }

    async #insert() {
        try {
            const [res] = await knex('users').insert({ name: this.name, email: this.email }).returning('id')
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
            const attrs = { name: this.name, email: this.email }
            const [res] = await knex('users')
                .where('id', this.id)
                .update({ ...attrs, updated_at: knex.fn.now() }) // updated_at はデータベース側で更新
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

    static #length(str, conds) {
        if (conds.maximum) {
            return str.length <= conds.maximum
        }
        return true
    }
}

module.exports = User
