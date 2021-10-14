# Event listener

Because everyone has to have their own event listener implementation for some reason.

## Usage

```typescript
import Listener from `@thunderbite/event-listener`

class FooBar {
    public readonly onFoo = new Listener()
    public readonly onBar = new Listener<(foo: string, bar: number) => void>()
    public foo() {
        this.onFoo.invoke()
    }
    public bar() {
        this.onBar.invoke("foo", 0xba6)
    }
}

const fooBar = new FooBar()

fooBar.onFoo.add(() => console.log("foo"))
fooBar.onBar.add((foo, bar) => console.log(foo + bar))

fooBar.foo()
fooBar.bar()
```

## Instance methods

| name | signature | description |
|:---|:---:|:---|
| add | `(listener: T) => T` | add a callback, returns the callback that was passed to it |
| remove | `(listener: T) => boolean` | remove a callback, returns true if the callback was found |
| clear | `() => void` | remove all callbacks |
| invoke | `(...args: Parameters<T>) => T` | invoke all callbacks |
