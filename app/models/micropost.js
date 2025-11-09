const RecordBase = require('./record_base')
const knexUtils = require('../db/knex_utils')
const knex = knexUtils.knex

class Micropost extends RecordBase {
    id // 自動で割り振られる。user.id = 3 等の id の手動での変更は save 時にエラーになる。変更しないこと
    content
    userId // 外部キー。users tableのid
    createdAt // 自動で割り振られる
    updatedAt // 自動で割り振られる

    constructor(params = {}) {
        super()
        this.content = params.content
        this.userId = params.userId

        // userとの関連付け
        const self = this
        const User = require('./user') // 循環参照の問題を避けるためここに置く
        const userFunc = async function () {
            return await User.find(self.userId)
        }
        this.user = userFunc
    }

    valid() {
        const props = []
        const messages = []
        let v = true

        if (!Micropost.#presence(this.userId)) {
            v = false
            props.push('userId')
            messages.push('user id can\'t be blank')
        }

        if (!Micropost.#presence(this.content)) {
            v = false
            props.push('userId')
            messages.push('content can\'t be blank')
        }

        if (!Micropost.#validLength(this.content, { maximum: 140 })) {
            v = false
            props.push('content')
            messages.push('content is too long')
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

    async updateAttribute(key, value) {
        if (this.persisted) {
            try {
                if (key === 'userId') key = 'user_id'
                if (key === 'createdAt') key = 'created_at'
                const params = { [key]: value }
                const [res] = await knex('microposts')
                    .where('id', this.id)
                    .update({ ...params, updated_at: knex.fn.now() }) // updated_at はデータベース側で更新
                    .returning('id')
                await this.#reload(res.id)
                this.setSaved()
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
            const params = this.#paramsToDB()
            const [res] = await knex('microposts').insert(params).returning('id')
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
            const [res] = await knex('microposts')
                .where('id', this.id)
                .update({ ...params, updated_at: knex.fn.now() }) // updated_at はデータベース側で更新
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
        const toDB = {
            content: this.content, user_id: this.userId
        }
        return toDB
    }

    async #reload(id) {
        try {
            const m = await Micropost.find(id)
            if (!m) return false
            Object.assign(this, m)
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    // static methods
    static async create(params = {}) {
        const user = new Micropost(params)
        if (await user.save()) {
            return user
        } else {
            return null
        }
    }

    static async find(id) {
        try {
            const obj = await knex('microposts').select('*').where('id', id).first()
            return Micropost.#dbToMicropostObject(obj)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static defaultScope = {
        order: {
            column: 'created_at',
            direction: 'desc',
        },
    }

    static async findBy(params = {}) {
        const params2 = Micropost.#micropostToDbParams(params)
        try {
            const li = await knex('microposts').select('*').where(params2)
                .orderBy(Micropost.defaultScope.order.column, Micropost.defaultScope.order.direction)
            return li.map(o => Micropost.#dbToMicropostObject(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async first() {
        try {
            const obj = await knex('microposts').select('*')
                .orderBy(Micropost.defaultScope.order.column, Micropost.defaultScope.order.direction)
                .limit(1).first()
            return Micropost.#dbToMicropostObject(obj)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async count(options = { where: undefined }) {
        let builder = knex('microposts').count('* as count')
        if (options.where) {
            const where = Micropost.#micropostToDbParams(options.where)
            builder = builder.where(where)
        }
        const { count } = await builder.first()
        // 文字列の可能性があるので Number に変換
        return Number(count)
    }

    static async paginate(perPage, offset, options = { where: undefined }) {
        try {
            let builder = knex('microposts').select('*')
                .orderBy(Micropost.defaultScope.order.column, Micropost.defaultScope.order.direction)
            if (perPage) builder = builder.limit(perPage).offset(offset)
            if (options.where) {
                const where = Micropost.#micropostToDbParams(options.where)
                builder = builder.where(where)
            }
            const li = await builder
            return li.map(o => Micropost.#dbToMicropostObject(o))
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static #micropostToDbParams(m) {
        if (m) {
            const db = {}
            Object.assign(db, m)
            if (db.userId) {
                db.user_id = db.userId
                delete db.userId
            }
            return db
        } else {
            return null
        }
    }

    static #dbToMicropostObject(obj) {
        if (obj) {
            const m = new Micropost()
            m.id = obj.id
            m.content = obj.content
            m.userId = obj.user_id
            m.createdAt = obj.created_at
            m.updatedAt = obj.updated_at
            m.setSaved()
            return m
        } else {
            return null
        }
    }

    static #presence(x) {
        if (typeof x === 'number') {
            return x !== 0
        } else if (typeof x === 'string') {
            return !!x.trim()
        }
        return !!x
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
}

module.exports = Micropost
