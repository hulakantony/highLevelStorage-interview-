const lowLevelStorage = {
	data: {},
	get (key, callback) {
		setTimeout(() => {
			callback(this.data[key])
		}, 1000)
	},
	put (key, value, callback) {
		setTimeout(() => {
			this.data[key] = value;
			callback({key, value})
		}, 1000)
	},
	del (key, callback) {
		setTimeout(() => {
			callback(delete this.data[key])
		}, 1000)
	},
	getData (url, callback) {
		fetch(url)
			.then(data => {
				return data.json();
			})
			.then(data => {
				callback(data)
			})
	},
};

const wrap = (storage) => {
	const polymorphedStorage = Object.getOwnPropertyNames(storage).reduce((sum, property) => {
		if (typeof storage[property] !== 'function') {
			return { ...sum,  [property]: storage[property] };
		}
		const promisifiedMethod = (...args) => {
			const parsedArgs = args.length > 1 && 
				typeof args[args.length - 1] === 'function'
				? args.slice(0, args.length - 1)
				: args;
			return new Promise(resolve => {
				return storage[property].apply(storage, [...parsedArgs, resolve]);
			})
		}
		return { ...sum, [property]: promisifiedMethod };
	}, {});
	polymorphedStorage.batchPut = (data) => {
		const promiseArray = data.map(object => {
			return polymorphedStorage.put.apply(polymorphedStorage, [...Object.values(object), Promise.resolve]);
		});
		return Promise.all(promiseArray);
	}
	return polymorphedStorage;
};

const highLevelStorage = wrap(lowLevelStorage);


highLevelStorage.put('foo', 'bar')
	.then(data => {
		console.log(data);
	});

highLevelStorage.get('foo')
	.then(data => {
		console.log(data);
	});

highLevelStorage.del('foo')
	.then(data => {
		console.log(data);
	});

highLevelStorage.batchPut([{ key: 'hello', value: 'World' }, { key: 'I love', value: 'Javascript' }])
	.then(data => {
		console.log(data);
	})

highLevelStorage.del('hello')
	.then(data => {
		console.log(data);
		console.log(highLevelStorage.data);
	});
