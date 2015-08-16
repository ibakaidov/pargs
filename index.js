var async = require('async');
var Promise = require("promise");
/**
 * @class Argument
 * @name promise
 */
var Argument = (function () {
    function Argument(promise, onerror) {
        var _this = this;
        if (onerror === void 0) { onerror = false; }
        this.promise = (new Promise(promise));
        if (onerror)
            this.promise.catch(onerror);
        this.promise.then(function (value) {
            return _this.value = value;
        });
    }
    return Argument;
})();
;
/**
 * @function pargs
 * @param func {function} async function
 * @param ...args args for call function
 * @return {Argument} abstraction @see Argument
*/
var entry = function (func) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var onerror = entry.onerror;
    if (func instanceof Argument) {
        return entry(function (func, args, callback) {
            args.push(callback);
            func.apply(this, args);
        }, func, args);
    }
    var needwait = args.filter(function (arg) {
        return arg instanceof Argument;
    });
    var call = function () {
        return new Argument(function (resolve, reject) {
            var callback = function (error, result) {
                if (error)
                    return reject(error);
                resolve(result);
            };
            args.push(callback);
            func.apply(this, args);
        }, onerror);
    };
    if (needwait.length === 0) {
        return call();
    }
    return new Argument(function (resolve, reject) {
        async.map(needwait, function (arg, cb) {
            arg.promise.then(function (result) {
                cb(null, result);
            }).catch(cb);
        }, function (error, results) {
            results.map(function (arg, index) {
                args[args.indexOf(needwait[index])] = arg;
            });
            call().promise.then(resolve).catch(reject);
        });
    }, onerror);
};
entry.sync = function () {
    var func = arguments[0];
    if (func instanceof Argument) {
        var args = [].slice.apply(arguments);
        args.shift();
        return entry.sync(function (func, args) {
            return func.apply(this, args);
        }, func, args);
    }
    arguments[0] = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var callback = args.pop();
        try {
            callback(null, func.apply(this, args));
        }
        catch (error) {
            callback(error);
        }
    };
    return entry.apply(this, arguments);
};
entry.deps = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var deps = args.pop();
    var handler = function () {
        entry.apply(null, args);
    };
    deps.unshift(handler);
    entry.apply(null, deps);
};
entry.deps.sync = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var deps = args.pop();
    var handler = function () {
        entry.sync.apply(null, args);
    };
    deps.unshift(handler);
    entry.apply(null, deps);
};
entry.field = function (object, name) {
    return entry.s(function (object) {
        return object[name].bind(object);
    }, object);
};
entry.array = function (array) {
    if (array instanceof Argument) {
        return entry(function (array, callback) {
            entry.s(function (arr) {
                return callback(null, arr);
            }, entry.a(array));
        }, array);
    }
    array.unshift(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        return args;
    });
    return entry.s.apply(null, array);
};
entry.s = entry.sync;
entry.d = entry.deps;
entry.d.s = entry.d.sync;
entry.f = entry.field;
entry.a = entry.array;
module.exports = entry;
//# sourceMappingURL=index.js.map