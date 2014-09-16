/**
 * 针对 fis 量身定做。
 * 由于编译期会处理并优化一些事情，所以此 amd loader 不需要考虑所有的用法。
 */

var require, define, F;
(function(undef) {
    var defined = {},
        waiting = {},
        config = {},
        defining = {},
        slice = [].slice,
        hasOwn = Object.prototype.hasOwnProperty,
        head = document.getElementsByTagName('head')[0],
        timeout = 5000,
        ext = '.js',
        handlers, req;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    handlers = {
        require: function() {
            return function() {
                return req.apply(undef, arguments);
            };
        },

        exports: function(name) {
            return hasProp(defined, name) ? defined[name] : (defined[name] = {});
        },

        module: function(name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: function() {
                    return (config && config.config && config.config[name]) || {};
                }
            };
        }
    };

    function callDep(name, callback) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];

            delete waiting[name];
            defining[name] = true;

            if (callback) {
                args[2] = (function(old, fn) {

                    return function(require) {
                        var ret = typeof old === 'function' ? old.apply(this, arguments) : old;

                        // 要等 return ret 后 defined 里面才有数据。
                        setTimeout(fn, 4);
                        return ret;
                    };
                })(args[2], callback);

                return main.apply(undef, args);
            }

            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }

        return callback ? callback() : defined[name];
    }

    function resolve(name) {
        var paths = config.paths || {},
            path = paths[name] || name;

        return /\.js$/.test(path) ? path : (path + ext);
    }

    function loadJs(url, cb) {
        var script = document.createElement('script'),
            loaded = false,

            clean = function() {
                clearTimeout(timer);
                script.onload = script.onreadystatechange = script.onerror = null;
                head.removeChild(script);
            },

            wrap = function() {
                if (!loaded && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
                    loaded = true;
                    clean();
                    cb();
                }
            },

            onerror = function() {
                clean();
                throw new Error('Can\'t load ' + url);
            },

            timer;

        script.setAttribute('src', url);
        script.setAttribute('type', 'text/javascript');
        script.onload = script.onreadystatechange = wrap;
        script.onerror = onerror;
        head.appendChild(script);
        timer = setTimeout(onerror, timeout);
    }

    function main(name, deps, callback) {
        var callbackType = typeof callback,
            args = [],
            usingExports = false,
            i = deps.length,
            next, len, cjsModule, depName;

        if (callbackType === 'undefined' || callbackType === 'function') {
            deps = !deps.length && callback.length ? (i = 3, ['require', 'exports', 'module']) : deps;

            next = function() {
                var ret = callback ? callback.apply(defined[name], args) : undefined;

                if (name) {
                    if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                        defined[name] = cjsModule.exports;
                    } else if (ret !== undef || !usingExports) {
                        defined[name] = ret;
                    }
                }
            };

            while (i--) {
                next = (function(next, depName, i) {
                    return function() {
                        var path;

                        if (depName === "require") {
                            args[i] = handlers.require(name);
                        } else if (depName === "exports") {
                            args[i] = handlers.exports(name);
                            usingExports = true;
                        } else if (depName === "module") {
                            cjsModule = args[i] = handlers.module(name);
                        } else if (hasProp(defined, depName) ||
                            hasProp(waiting, depName) ||
                            hasProp(defining, depName)) {

                            return callDep(depName, function() {
                                args[i] = callDep(depName);
                                next();
                            });
                        } else {
                            path = resolve(depName);

                            return loadJs(path, function() {
                                callDep(depName, function() {
                                    args[i] = callDep(depName);
                                    next();
                                });
                            });
                        }
                        next();
                    }
                })(next, deps[i], i);
            }
            next();
        } else if (name) {
            defined[name] = callback;
        }
    }

    require = req = function(deps, callback) {
        if (typeof deps === "string") {
            return callDep(deps);
        }

        setTimeout(function() {
            main(undef, deps, callback);
        }, 4);
    };

    function extend(a, b) {
        var i, v;

        if (!a || !b || typeof b !== 'object') {
            return a;
        }

        for (i in b) {
            if (hasProp(b, i)) {
                v = b[i];

                if (typeof v === 'object' && !v.splice) {
                    extend(a[i] || (a[i] = {}), v);
                } else {
                    a[i] = v;
                }
            }
        }
    }

    req.config = function(cfg) {
        extend(config, cfg);
    };

    // define(id, deps ?, factory)
    define = function(name, deps, factory) {
        if (!deps.splice) {
            factory = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, factory];
        }
    }

    define.amd = {};

    // ------------------------------
    //
    // ------------------------------

    var storage = (function() {

        function Base() {
            var data = {};

            this.get = function(key) {
                return key ? data[key] : data;
            };

            this.set = function(key, val) {
                if (arguments.length == 1) {
                    data = key;
                } else {
                    data[key] = val;
                    return val;
                }
            };

            this.save = this.clear = function() {
                // implements this.
            };
        }

        function LocalStorage() {
            Base.apply(this, arguments);

            var key = 'fis';

            var str = localStorage[key];

            if (str) {
                this.set(JSON.parse(str));
            }

            this.save = function() {
                localStorage[key] = JSON.stringify(this.get());
            };

            this.clear = function() {
                delete localStorage[key];
            };
        }

        function indexedDB() {
            // 待调研
        }

        function factory() {
            // 根据运行时能力来实例化一个最优的方案。
            return new LocalStorage();
        }

        return factory();
    })();

    var resource = (function(storage) {
        var api = {};

        function ajax(url, cb, data) {
            var xhr = new(window.XMLHttpRequest || ActiveXObject)('Microsoft.XMLHTTP');

            xhr.onreadystatechange = function() {
                if (this.readyState == 4) {
                    cb(this.responseText);
                }
            };
            xhr.open(data ? 'POST' : 'GET', url + '&t=' + ~~(Math.random() * 1e6), true);

            if (data) {
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send(data);
        }

        var head = document.getElementsByTagName('head')[0];
        function globalEval(code) {
            var script;

            code = code.replace(/^\s+/, '').replace(/\s+$/, '');

            if (code) {
                if (code.indexOf('use strict') === 1) {
                    script = document.createElement('script');
                    script.text = code;
                    head.appendChild(script).parentNode.removeChild(script);
                } else {
                    eval(code);
                }
            }
        }

        api.getChangeList = function(pkgs, done) {
            var list = [];

            for (var i = 0, len = pkgs.length; i < len; i++) {
                var item = pkgs[i];
                var pkg = storage.get(item.id);

                if (!pkg || pkg.hash !== item.hash) {
                    list.push(item.id);
                }
            }

            if (list.length) {
                ajax('/ls-diff.php?type=list&pid='+list.join(','), function(response) {
                    var data = JSON.parse(response);

                    // update list data.
                    for (var id in data) {
                        if (!hasProp(data, id)) {
                            continue;
                        }

                        var pkg = storage.get(id) || storage.set(id, {});
                        var item = data[id];

                        pkg.list = item.list;
                        pkg.hash = item.hash;
                        pkg.type = item.type;

                        pkg.data = item.data || {};
                    }
                    done(data);
                });
            } else {
                done();
            }
        };

        api.updatePkgs = function(data) {
            // update list data.
            for (var id in data) {
                if (!hasProp(data, id)) {
                    continue;
                }

                var pkg = storage.get(id) || storage.set(id, {});
                var item = data[id];

                for (var hash in item.data) {
                    if (!hasProp(item.data, hash)) {
                        continue;
                    }

                    pkg.data[hash] = item.data[hash];
                }
            }

            storage.save();
        };

        api.fetchPkgs = function(obj, done) {
            var params = [];

            for (var key in obj) {
                if (hasProp(obj, key)) {
                    var item = obj[key];
                    params.push('' + key + '=' + item.list.join(',') );
                }
            }

            ajax('/ls-diff.php?type=data&'+params.join('&'), function(response) {
                var data = JSON.parse(response);

                api.updatePkgs(data);
                done();
            });
        };

        api.load = function(pkgs, done) {
            var runjs = function(data) {
                if (data) {
                    api.updatePkgs(data);
                }

                var js = '';
                for (var i = 0, len = pkgs.length; i < len; i++) {
                    var item = pkgs[i];
                    var pkg = storage.get(item.id);
                    var hashs = pkg.list;

                    for (var j = 0, ken = hashs.length; j < ken; j++) {
                        js += pkg.data[hashs[j]];
                    }
                }
                js && globalEval(js);
                done();
            };

            api.getChangeList(pkgs, function(data) {
                if (data) {
                    api.fetchPkgs(data, runjs);
                } else {
                    runjs();
                }
            });
        }

        return api;
    })(storage);

    // expose
    F = resource.load;
    F.load = F;
})();