/*
using Ready class, we can have static properties for only the class itself. 
regular `class B extends A{}.prop` will take the `A`'s prop. modifying it will 
couse side effects for the parent class too. by using Ready we can give 
child classes its own `.prop` *without any additional process in child class*.

- you define a function that returns to a class which is schema  
	_with the first instance initialization, it will set the schema properties_
- define with a different name in schema like `._prop` to hold the actual value
- add `static get prop() {return this._prop}`
- add `static set prop(arg) {return this._prop=arg}`  
	_and now we don't need any instance_

note that all this is being in parent class. so the child class have its own 
values that are separate from the parent class.
*/
class Ready {
	constructor() {
		this.constructor.ready()
	}
	static identify = () => null
	static get isReady() {
		return this.identify() == this
	}
	/*
		calling it will set the properties of the class returned from schema  
		to the class itself. it can be called once for every class. calling it more
		will do nothing. so it is safe to check if a property has been assigned.
		it won't overwrite it. `myClass.ready().property`
	*/
	static ready() {
		if (this.isReady) return this
		this.onReadyDev()
		this.makeReady()
		return this
	}
	static makeReady() {
		this.identify = () => this
	}
	static onReadyDev() {
		this.assignSchema()
		this.onReady()
	}
	static assignSchema() {
		let schema = this.schema()
		for (let staticPropName in schema) {
			this[staticPropName] = schema[staticPropName]
		}
	}
	/*
		schema is called on ready, but also there's an onReady method to change  
		without touching the schema function.
	*/
	static onReady() {
		// super.onReady()
		// user code
	}
	static schema = () =>
		class {
			static _objects = []
		}
	/* 
		this will prevent reaching parent class's prop when accessed the prop 
		before .ready() called at least once in child class. should define a 
		getter 	for every property so you can access them before initialization 
		of any child class' object and don't have to call .ready() before. 
		this way .ready() is being already called when .prop is accessed.

		! important ! don't use the same name in schema and getter/setter. 
		getter/setter setter are just wrapper for .ready() but the name in the 
		schema class is the name of the propertie to hold the actual value.
	*/
	get objects() {
		return this.ready()._objects
	}
	set objects(arg) {
		this.ready()._objects = arg
	}
}

// self static properties for child classes
;(() => {
	class Groups extends Ready {
		static schema = () => class {
				static members = []
			}
		constructor(memberName) {
			super()
			this.name = memberName
			this.constructor.members.push(this)
		}
	}

	class GroupA extends Groups {}
	class GroupB extends Groups {}

	new GroupA("Alp")
	new GroupA("Astro")
	new GroupB("Bitter")

	console.log(GroupA.members) // this was actually the motive for me
	console.log(GroupB.members) // to create this library. I needed it

	console.log("---")
})()

// inheritance with self static properties
;(() => {
	class Cat extends Ready {
		static schema = () => class {
				static extinct = false
				static purrs = true
			}
	}

	class SaberToothed extends Cat {
		static schema = () => class extends super.schema() {
				static extinct = true
			}
	}

	Cat.ready()
	SaberToothed.ready()

	console.log(Cat)
	console.log(SaberToothed)

	console.log("---")

	// parent schemas are inherited, but they don't point to the same value so
	// child classes have their own copies
})()

// using custom getters, so no .ready() or initialization of an object isn't necessary
;(() => {
	class Cat extends Ready {
		static schema = () =>
			class {
				static _extinct = false
				static _purrs = true
			}
		static get extinct() {
			return this.ready()._extinct
		}
		static get purrs() {
			return this.ready()._purrs
		}
	}

	class SaberToothed extends Cat {
		static schema = () => class extends super.schema() {
				static _extinct = true
			}
	}

	console.log(Cat.extinct, Cat.purrs)
	console.log(SaberToothed.extinct, SaberToothed.purrs)

	console.log("---")
	// this boolean values would work fine with normal static properties too. 
	// it's just an easy example to show things. the real use of Ready is when you 
	// need to mutate child class property. like in the first - adding to an array
})()

// !not having the set/get pair or reaching a property before calling .ready()
// will get the property from parent. calling .ready() later rewrites it.!
;(() => {
	class Parent extends Ready {
		static schema = () =>
			class {
				static arr = []
			}
	}
	class Child extends Parent {}

	Parent.ready()
	Parent.arr.push(2)

	console.log("P", Parent.arr)
	console.log("C", Child.arr)
	Child.ready() // was using Parent's .arr, now has its own which is []
	console.log("P", Parent.arr)
	console.log("C", Child.arr)
	// so, defining getter/setter in the parent is the safest way.
})()
