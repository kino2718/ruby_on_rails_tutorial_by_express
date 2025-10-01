class RecordBase {
    #newRecord = true
    #destroyed = false

    get newRecord() {
        return this.#newRecord
    }

    get destroyed() {
        return this.#destroyed
    }

    setDestroyed() {
        this.#newRecord = false
        this.#destroyed = true
    }

    get persisted() {
        return !this.#newRecord && !this.#destroyed
    }

    setSaved() {
        if (!this.destroyed) {
            this.#newRecord = false
        }
    }
}

module.exports = RecordBase
