/*!
 * @doc function
 * @id DSLocalStorageAdapterProvider
 * @name DSLocalStorageAdapterProvider
 */
function DSLocalStorageAdapterProvider() {

  this.$get = ['$q', 'DSUtils', 'DSErrors', function ($q, DSUtils, DSErrors) {

    /**
     * @doc interface
     * @id DSLocalStorageAdapter
     * @name DSLocalStorageAdapter
     * @description
     * Adapter that uses `localStorage` as its persistence layer. The localStorage adapter does not support operations
     * on collections because localStorage itself is a key-value store.
     */
    return {

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:GET
       * @name GET
       * @description
       * An asynchronous wrapper for `localStorage.getItem(key)`.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.GET(key)
       * ```
       *
       * @param {string} key The key path of the item to retrieve.
       * @returns {Promise} Promise.
       */
      GET: function (key) {
        var deferred = $q.defer();
        try {
          var item = localStorage.getItem(key);
          deferred.resolve(item ? angular.fromJson(item) : undefined);
        } catch (err) {
          deferred.reject(err);
        }
        return deferred.promise;
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:PUT
       * @name PUT
       * @description
       * An asynchronous wrapper for `localStorage.setItem(key, value)`.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.PUT(key, value)
       * ```
       *
       * @param {string} key The key to update.
       * @param {object} value Attributes to put.
       * @returns {Promise} Promise.
       */
      PUT: function (key, value) {
        var DSLocalStorageAdapter = this;
        return DSLocalStorageAdapter.GET(key).then(function (item) {
          if (item) {
            DSUtils.deepMixIn(item, value);
          }
          localStorage.setItem(key, angular.toJson(item || value));
          return DSLocalStorageAdapter.GET(key);
        });
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:DEL
       * @name DEL
       * @description
       * An asynchronous wrapper for `localStorage.removeItem(key)`.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.DEL(key)
       * ```
       *
       * @param {string} key The key to remove.
       * @returns {Promise} Promise.
       */
      DEL: function (key) {
        var deferred = $q.defer();
        try {
          localStorage.removeItem(key);
          deferred.resolve();
        } catch (err) {
          deferred.reject(err);
        }
        return deferred.promise;
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:find
       * @name find
       * @description
       * Retrieve a single entity from localStorage.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.find(resourceConfig, id[, options])
       * ```
       *
       * ## Example:
       * ```js
       * DS.find('user', 5, {
       *   adapter: 'DSLocalStorageAdapter'
       * }).then(function (user) {
       *   user; // { id: 5, ... }
       * });
       * ```
       *
       * @param {object} resourceConfig DS resource definition object:
       * @param {string|number} id Primary key of the entity to retrieve.
       * @param {object=} options Optional configuration. Properties:
       *
       * - `{string=}` - `baseUrl` - Base path to use.
       *
       * @returns {Promise} Promise.
       */
      find: function find(resourceConfig, id, options) {
        options = options || {};
        return this.GET(DSUtils.makePath(options.baseUrl || resourceConfig.baseUrl, resourceConfig.endpoint, id));
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:findAll
       * @name findAll
       * @description
       * Not supported.
       */
      findAll: function () {
        throw new Error('DSLocalStorageAdapter.findAll is not supported!');
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:create
       * @name create
       * @description
       * Create an entity in `localStorage`. You must generate the primary key and include it in the `attrs` object.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.create(resourceConfig, attrs[, options])
       * ```
       *
       * ## Example:
       * ```js
       * DS.create('user', {
       *   id: 1,
       *   name: 'john'
       * }, {
       *   adapter: 'DSLocalStorageAdapter'
       * }).then(function (user) {
       *   user; // { id: 1, name: 'john' }
       * });
       * ```
       *
       * @param {object} resourceConfig DS resource definition object:
       * @param {object} attrs Attributes to create in localStorage.
       * @param {object=} options Optional configuration. Properties:
       *
       * - `{string=}` - `baseUrl` - Base path to use.
       *
       * @returns {Promise} Promise.
       */
      create: function (resourceConfig, attrs, options) {
        if (!(resourceConfig.idAttribute in attrs)) {
          throw new DSErrors.IA('DSLocalStorageAdapter.create: You must provide a primary key in the attrs object!');
        }
        options = options || {};
        return this.PUT(
          DSUtils.makePath(options.baseUrl || resourceConfig.baseUrl, resourceConfig.getEndpoint(attrs, options), attrs[resourceConfig.idAttribute]),
          attrs
        );
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:update
       * @name update
       * @description
       * Update an entity in localStorage.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.update(resourceConfig, id, attrs[, options])
       * ```
       *
       * ## Example:
       * ```js
       * DS.update('user', 5, {
       *   name: 'john'
       * }, {
       *   adapter: 'DSLocalStorageAdapter'
       * }).then(function (user) {
       *   user; // { id: 5, ... }
       * });
       * ```
       *
       * @param {object} resourceConfig DS resource definition object:
       * @param {string|number} id Primary key of the entity to retrieve.
       * @param {object} attrs Attributes with which to update the entity.
       * @param {object=} options Optional configuration. Properties:
       *
       * - `{string=}` - `baseUrl` - Base path to use.
       *
       * @returns {Promise} Promise.
       */
      update: function (resourceConfig, id, attrs, options) {
        options = options || {};
        return this.PUT(DSUtils.makePath(options.baseUrl || resourceConfig.baseUrl, resourceConfig.getEndpoint(id, options), id), attrs);
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:updateAll
       * @name updateAll
       * @description
       * Not supported.
       */
      updateAll: function () {
        throw new Error('DSLocalStorageAdapter.updateAll is not supported!');
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:destroy
       * @name destroy
       * @description
       * Destroy an entity from localStorage.
       *
       * ## Signature:
       * ```js
       * DSLocalStorageAdapter.destroy(resourceConfig, id[, options])
       * ```
       *
       * ## Example:
       * ```js
       * DS.destroy('user', 5, {
       *   name: ''
       * }, {
       *   adapter: 'DSLocalStorageAdapter'
       * }).then(function (user) {
       *   user; // { id: 5, ... }
       * });
       * ```
       *
       * @param {object} resourceConfig DS resource definition object:
       * @param {string|number} id Primary key of the entity to destroy.
       * @param {object=} options Optional configuration. Properties:
       *
       * - `{string=}` - `baseUrl` - Base path to use.
       *
       * @returns {Promise} Promise.
       */
      destroy: function (resourceConfig, id, options) {
        options = options || {};
        return this.DEL(DSUtils.makePath(options.baseUrl || resourceConfig.baseUrl, resourceConfig.getEndpoint(id, options), id));
      },

      /**
       * @doc method
       * @id DSLocalStorageAdapter.methods:destroyAll
       * @name destroyAll
       * @description
       * Not supported.
       */
      destroyAll: function () {
        throw new Error('Not supported!');
      }
    };
  }];
}

module.exports = DSLocalStorageAdapterProvider;
