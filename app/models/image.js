const RecordBase = require('./record_base')
const knexUtils = require('../db/knex_utils')
const knex = knexUtils.knex
const fs = require('fs')
const path = require('path')

class Image extends RecordBase {
    id // 自動で割り振られる
    micropostId
    fileName
    mimeType
    size
    createdAt

    constructor(params = {}) {
        super()
        this.micropostId = params.micropostId
        this.fileName = params.fileName
        this.mimeType = params.mimeType
        this.size = params.size
    }

    valid() {
        const props = []
        const messages = []
        let v = true

        if (!Image.#presence(this.micropostId)) {
            v = false
            props.push('micropostId')
            messages.push("micropost id can't be blank")
        }

        if (!Image.#presence(this.fileName)) {
            v = false
            props.push('fileName')
            messages.push("file name can't be blank")
        }

        if (v) {
            this.errors = undefined
        }
        else {
            this.errors = {
                fullMessages: messages,
                props: props
            }
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
        }
        else {
            // 破棄済み。何もしない
            return false
        }
    }

    async updateAttribute(key, value) {
        if (this.persisted) {
            try {
                key = Image.#propNameToDbColumName(key)
                const params = { [key]: value }
                const [res] = await knex('images')
                    .where('id', this.id)
                    .update(params)
                    .returning('id')
                await this.#reload(res.id)
                this.setSaved()
                return true
            } catch (e) {
                console.error(e)
                return false
            }
        }
    }

    async #insert() {
        try {
            const params = this.#paramsToDB()
            delete params.created_at // 作成時刻はdbが作成
            const [res] = await knex('images').insert(params).returning('id')
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
            const [res] = await knex('images'
                .where('id', this.id)
                .update(params)
                .returning('id')
            )
            await this.#reload(res.id)
            this.setSaved()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    #paramsToDB() {
        return Image.#imageToDbParams(this)
    }

    async #reload(id) {
        try {
            const o = await Image.find(id)
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
                // まずデータベースのレコードを削除し保存されている画像ファイルを削除する。
                await knex('images').where({ id: this.id }).del()

                const filePath = path.join(__dirname, '../../', this.fileName)
                await fs.promises.unlink(filePath)

                this.setDestroyed()
            } catch (e) {
                console.error(e)
            }
        }
        return this
    }

    // static methods
    static async create(params = {}) {
        const o = new Image(params)
        if (await o.save()) return o
        else return null
    }

    static async find(id) {
        try {
            const o = await knex('images').select('*').where('id', id).first()
            return Image.#dbToImage(o)
        } catch (e) {
            console.error(e)
            return null
        }
    }

    static async findBy(params = {}) {
        const params2 = Image.#imageToDbParams(params)
        try {
            const arrays = await knex('images').select('*').where(params2)
            return arrays.map(r => Image.#dbToImage(r))
        }
        catch (e) {
            console.error(e)
            return null
        }
    }

    static #imageToDbParams(o) {
        if (o) {
            const toDB = {}
            for (const [key, value] of Object.entries(o)) {
                const columnName = Image.#propNameToDbColumName(key)
                if (columnName) toDB[columnName] = value
            }
            return toDB
        } else {
            return null
        }
    }

    static #dbToImage(o) {
        if (o) {
            const image = new Image()
            for (const [key, value] of Object.entries(o)) {
                const propName = Image.#dbColumnNameToPropName(key)
                if (propName) image[propName] = value
            }
            image.setSaved()
            return image
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


    static #propNameToDbColumName(name) {
        switch (name) {
            case 'id': return 'id'
            case 'micropostId': return 'micropost_id'
            case 'fileName': return 'file_name'
            case 'mimeType': return 'mime_type'
            case 'size': return 'size'
            case 'createdAt': return 'created_at'
            default: return null
        }
    }

    static #dbColumnNameToPropName(name) {
        switch (name) {
            case 'id': return 'id'
            case 'micropost_id': return 'micropostId'
            case 'file_name': return 'fileName'
            case 'mime_type': return 'mimeType'
            case 'size': return 'size'
            case 'created_at': return 'createdAt'
            default: return null
        }
    }
}

module.exports = Image
