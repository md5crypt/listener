export class Listener<T extends (...args: any[]) => void | Promise<void> = () => void> {
	public static readonly REMOVE = Symbol()

	private readonly _list: (T | null)[] = []
	private _active = 0
	private _count = 0
	private _dirty = false

	// yes, this could be replaced with this.list = this.list.filter(x => x)
	// but this does it in place without allocating new objects
	private gc() {
		const array = this._list
		const length = array.length
		let i = 0
		let j = 0
		loop: while (true) {
			while (array[i] !== null) {
				i += 1
				if (i >= length) {
					break loop
				}
			}
			if (i >= j) {
				j = i + 1
			}
			if (j >= length) {
				break
			}
			while (array[j] === null) {
				j += 1
				if (j >= length) {
					break loop
				}
			}
			array[i] = array[j]
			array[j] = null
			j += 1
			i += 1
		}
		if (i < length) {
			const delta = length - i
			if (delta === 1) {
				array.pop()
			} else if (delta === 2) {
				array.pop()
				array.pop()
			} else {
				array.splice(-delta)
			}
		}
		this._dirty = false
	}

	public add(listener: T) {
		this._list.push(listener)
		this._count += 1
		if (this._dirty === true && this._active === 0) {
			this.gc()
		}

		return listener
	}

	public remove(listener: T) {
		const i = this._list.indexOf(listener)
		if (i >= 0) {
			this._list[i] = null
			this._dirty = true
			this._count -= 1

			return true
		}

		return false
	}

	public clear() {
		for (let i = 0; i < this._list.length; i += 1) {
			this._list[i] = null
		}
		this._count = 0
		this._dirty = true
	}

	public invoke(...args: Parameters<T>) {
		const list = this._list
		const length = list.length
		if (length > 0) {
			this._active += 1
			try {
				for (let i = 0; i < length; i += 1) {
					const func = list[i] as Function
					if (func !== null) {
						const result = func(...args)
						if (result === Listener.REMOVE && list[i] !== null) {
							list[i] = null
							this._dirty = true
							this._count -= 1
						}
					}
				}
			} finally {
				const active = this._active
				if (this._dirty === true && active === 1) {
					this.gc()
				}
				this._active = active - 1
			}
		}
	}

	public async asyncInvoke(...args: Parameters<T>) {
		const list = this._list
		const length = list.length
		if (length > 0) {
			this._active += 1
			try {
				for (let i = 0; i < length; i += 1) {
					const func = list[i] as Function
					if (func !== null) {
						let result = func(...args)
						if (result instanceof Promise) {
							result = await result
						}
						if (result === Listener.REMOVE && list[i] !== null) {
							list[i] = null
							this._dirty = true
							this._count -= 1
						}
					}
				}
			} finally {
				const active = this._active
				if (this._dirty === true && active === 1) {
					this.gc()
				}
				this._active = active - 1
			}
		}
	}

	public get length() {
		return this._count
	}

	public get empty() {
		return this._count === 0
	}
}

export default Listener
