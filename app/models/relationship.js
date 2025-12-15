const RecordBase = require('./record_base')
const knexUtils = require('../db/knex_utils')
const knex = knexUtils.knex

class Relationship extends RecordBase {
    id
    followerId
    followedId
    createdAt
    updatedAt

    constructor(params = {}) {
        super()
        this.followerId = params.followerId
        this.followedId = params.followedId
    }

    valid() {
        const props = []
        const messages = []
        let v = true

        if (!Relationship.#presence(this.followerId)) {
            v = false
            props.push('followerId')
            messages.push("follower id can't be blank")
        }

        if (!Relationship.#presence(this.followedId)) {
            v = false
            props.push('followedId')
            messages.push("followed id can't be blank")
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
        if (this.newRecord) {
            // insert
            if (!this.valid()) return false
            return this.#insert()
        } else if (this.persisted) {
            // update
            if (!this.valid()) return false
            return this.#update()
        } else {
            // 破棄済み。何もしない
            return false
        }
    }

    async updateAttribute(key, value) {
        if (this.persisted) {
            try {
                key = Relationship.#propNameToDbColumnName(key)
                const param = { [key]: value }
                const [res] = await knex('relationships')
                    .where('id', this.id)
                    .update(param)
                    .returning('id')
                await this.#reload(res.id)
                this.setSaved()
            } catch (e) {
                console.error(e)
                return false
            }
        }
        return false
    }

    async #insert() {
        try {
            const params = this.#paramsToDB()
            delete params.created_at // 作成時刻はdbが作成
            delete params.updated_at // 更新時刻はdbが作成
            const [res] = await knex('relationships').insert(params).returning('id')
            await this.#reload(res.id)
            this.setSaved()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async #update() {
        try {
            const params = this.#paramsToDB()
            delete params.updated_at // 更新時刻はdbが作成
            const [res] = await knex('relationships')
                .where('id', this.id)
                .update({ ...params, updated_at: knex.fn.now() })
                .returning('id')
            await this.#reload(res.id)
            this.setSaved()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    #paramsToDB() {
        return Relationship.#relationshipToDbParams(this)
    }

    async #reload(id) {
        try {
            const o = await Relationship.find(id)
            if (!o) return false
            Object.assign(this, o)
        } catch (e) {
            console.error(e)
            return false
        }
    }

    async destroy() {
        if (this.persisted) {
            try {
                await knex('relationships').where({ id: this.id }).del()
                this.setDestroyed()
            } catch (e) {
                console.error(e)
            }
        }
        return this
    }

    async follower() {
        const User = require('./user') // 循環参照を避けるためここに置く
        return await User.find(this.followerId)
    }

    async followed() {
        const User = require('./user') // 循環参照を避けるためここに置く
        return await User.find(this.followedId)
    }

    // static methods

    static async create(params = {}) {
        const o = new Relationship(params)
        if (await o.save()) return o
        else return null
    }

    static async find(id) {
        try {
            const o = await knex('relationships').select('*').where('id', id).first()
            return Relationship.#dbToRelationship(o)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async findBy(params = {}) {
        const params2 = Relationship.#relationshipToDbParams(params)
        try {
            const array = await knex('relationships').select('*').where(params2)
            return array.map(o => Relationship.#dbToRelationship(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async all() {
        try {
            const li = await knex('relationships').select('*').orderBy('id', 'asc')
            return li.map(o => Relationship.#dbToRelationship(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }


    static async count(params = {}) {
        const dbParams = Relationship.#relationshipToDbParams(params)
        const { count } = await knex('relationships').where(dbParams).count('* as count').first()
        // 文字列の可能性があるので Number に変換
        return Number(count)
    }

    static #presence(x) {
        if (typeof x === 'number') {
            return x !== 0
        } else if (typeof x === 'string') {
            return !!x.trim()
        }
        return !!x
    }

    static #relationshipToDbParams(o) {
        if (o) {
            const toDb = {}
            for (const [key, value] of Object.entries(o)) {
                const columnName = Relationship.#propNameToDbColumnName(key)
                if (columnName) toDb[columnName] = value
            }
            return toDb
        } else {
            return null
        }
    }

    static #dbToRelationship(o) {
        if (o) {
            const relationship = new Relationship()
            for (const [key, value] of Object.entries(o)) {
                const propName = Relationship.#dbColumnNameToPropName(key)
                if (propName) relationship[propName] = value
            }
            relationship.setSaved()
            return relationship
        } else {
            return null
        }
    }

    static #propNameToDbColumnName(name) {
        switch (name) {
            case 'id': return 'id'
            case 'followerId': return 'follower_id'
            case 'followedId': return 'followed_id'
            case 'createdAt': return 'created_at'
            case 'updatedAt': return 'updated_at'
            default: return null
        }
    }

    static #dbColumnNameToPropName(name) {
        switch (name) {
            case 'id': return 'id'
            case 'follower_id': return 'followerId'
            case 'followed_id': return 'followedId'
            case 'created_at': return 'createdAt'
            case 'updated_at': return 'updatedAt'
            default: return null
        }
    }
}

module.exports = Relationship
