export default class Listener<T extends (...args: any[]) => void | boolean = () => void> {
	public static readonly REMOVE = Symbol()

	private readonly list: (T | null)[] = []
	private active = false
	private dirty = false

	// yes, this could be replaced with this.list = this.list.filter(x => x)
	// but this does it in place without allocating new objects
	private gc() {
		const array = this.list
		const length = array.length
		let i = 0
		let j = 0
		loop: while (true) {
			while (array[i]) {
				i += 1
				if (i >= length) {
					break loop
				}
			}
			j = Math.max(i + 1, j)
			while (!array[j]) {
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
		while (i < length) {
			// poping seems to be the fastest way to delete a small
			// amount of elements from the end at least in 2021
			// splice is faster for a large amount of items
			// array.length = x takes ages to execute in chrome
			array.pop()
			i += 1
		}
		this.dirty = false
	}

	public add(listener: T) {
		this.list.push(listener)
		if (this.dirty && !this.active) {
			this.gc()
		}
		return listener
	}

	public remove(listener: T) {
		const i = this.list.indexOf(listener)
		if (i >= 0) {
			this.list[i] = null
			this.dirty = true
			return true
		}
		return false
	}

	public clear() {
		for (let i = 0; i < this.list.length; i += 1) {
			this.list[i] = null
		}
		this.dirty = true
	}

	public invoke(...args: Parameters<T>) {
		const list = this.list
		const length = list.length
		if (length) {
			this.active = true
			for (let i = 0; i < length; i += 1) {
				const func = list[i] as Function
				if (func) {
					if (func(...args) === Listener.REMOVE) {
						list[i] = null
						this.dirty = true
					}
				}
			}
			this.active = false
			if (this.dirty) {
				this.gc()
			}
		}
	}

	public get length() {
		if (this.dirty) {
			this.gc()
		}
		return this.list.length
	}

	public get empty() {
		return this.length == 0
	}
}
