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
	const proxiedObject = new Proxy(storage, {
		get (target, propKey) {
			// in case if object property is not a function just return value of property
			if (typeof target[propKey] !== 'function') {
				return target[propKey];
			}
			const origMethod = target[propKey];
			return function (...args) {
				// parse method arguments to remove callback if it exists
				const parsedArgs = args.length > 1 && 
					typeof args[args.length - 1] === 'function'
					? args.slice(0, args.length - 1)
					: args;
				return new Promise(resolve => {
					origMethod.apply(this, [...parsedArgs, resolve]);
				})
			};
		}
	});
	const batchPut = (data) => {
		const promiseArray = data.map(object => {
			return proxiedObject.put.apply(proxiedObject, [...Object.values(object), Promise.resolve]);
		});
		return Promise.all(promiseArray);
	}
	return { ...proxiedObject, batchPut }
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
		console.log(highLevelStorage.data);
	});

highLevelStorage.batchPut([{ key: 'hello', value: 'World' }, { key: 'I love', value: 'Javascript' }])
	.then(data => {
		console.log(data);
	})

highLevelStorage.del('hello')
	.then(data => {
		console.log(data);
		console.log(highLevelStorage.data);
		console.log(lowLevelStorage.data)
	});




