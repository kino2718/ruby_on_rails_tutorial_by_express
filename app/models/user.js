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
        return true
    }

    async save() {
        if (this.newRecord) {
            // insert
            return this.#insert()
        } else if (!this.destroyed) {
            // update
            return this.#update()
        } else {
            // 破棄済み。何もしない
            return false
        }
    }

    async #insert() {
        try {
            const [res] = await knex('users').insert({ name: this.name, email: this.email }).returning('id')
            const u = await User.find(res.id)
            if (!u) return false
            Object.assign(this, u)
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
                .returning('id');
            const u = await User.find(res.id)
            if (!u) return false
            Object.assign(this, u)
            this.setSaved()
            debugLog(this)
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
}

module.exports = User
