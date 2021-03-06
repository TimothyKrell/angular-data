describe('DS.findAll(resourceName, params[, options]): ', function () {
  function errorPrefix(resourceName) {
    return 'DS.findAll(' + resourceName + ', params[, options]): ';
  }

  beforeEach(startInjector);

  it('should throw an error when method pre-conditions are not met', function () {
    DS.findAll('does not exist', {}).then(function () {
      fail('should have rejected');
    }, function (err) {
      assert.isTrue(err instanceof DS.errors.NonexistentResourceError);
      assert.equal(err.message, errorPrefix('does not exist') + 'does not exist is not a registered resource!');
    });

    angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
      if (key) {
        DS.findAll('post', key, { cacheResponse: false }).then(function () {
          fail('should have rejected');
        }, function (err) {
          assert.isTrue(err instanceof DS.errors.IllegalArgumentError);
          assert.equal(err.message, errorPrefix('post') + 'params: Must be an object!');
        });
      }
    });

    angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
      if (key) {
        DS.findAll('post', {}, key).then(function () {
          fail('should have rejected');
        }, function (err) {
          assert.isTrue(err instanceof DS.errors.IllegalArgumentError);
          assert.equal(err.message, errorPrefix('post') + 'options: Must be an object!');
        });
      }
    });
  });
  it('should query the server for a collection', function () {
    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/posts\??/).respond(200, [p1, p2, p3, p4]);

    DS.findAll('post', {}).then(function (data) {
      assert.deepEqual(data, [p1, p2, p3, p4]);
    }, function (err) {
      console.error(err.stack);
      fail('Should not have rejected!');
    });

    assert.deepEqual(DS.filter('post', {}), [], 'The posts should not be in the store yet');

    // Should have no effect because there is already a pending query
    DS.findAll('post', {}).then(function (data) {
      assert.deepEqual(data, [p1, p2, p3, p4]);
    }, function (err) {
      console.error(err.stack);
      fail('Should not have rejected!');
    });

    $httpBackend.flush();

    assert.deepEqual(DS.filter('post', {}), [p1, p2, p3, p4], 'The posts are now in the store');
    assert.isNumber(DS.lastModified('post', 5));
    assert.isNumber(DS.lastSaved('post', 5));
    DS.find('post', p1.id); // should not trigger another XHR


    // Should not make a request because the request was already completed
    DS.findAll('post', {}).then(function (data) {
      assert.deepEqual(data, [p1, p2, p3, p4]);
    }, function (err) {
      console.error(err.stack);
      fail('Should not have rejected!');
    });

    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/posts\??/).respond(200, [p1, p2, p3, p4]);

    // Should make a request because bypassCache is set to true
    DS.findAll('post', {}, { bypassCache: true }).then(function (data) {
      assert.deepEqual(data, [p1, p2, p3, p4]);
    }, function (err) {
      console.error(err.stack);
      fail('Should not have rejected!');
    });

    $httpBackend.flush();

    assert.equal(lifecycle.beforeInject.callCount, 8, 'beforeInject should have been called');
    assert.equal(lifecycle.afterInject.callCount, 8, 'afterInject should have been called');
    assert.equal(lifecycle.serialize.callCount, 0, 'serialize should have been called');
    assert.equal(lifecycle.deserialize.callCount, 2, 'deserialize should have been called');
  });
  it('should fail when no "idAttribute" is present on an item in the response', function () {
    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/posts\??/).respond(200, [
      { author: 'John', age: 30 },
      { author: 'Sally', age: 31 }
    ]);

    DS.findAll('post', {}).then(function () {
      fail('Should not have succeeded!');
    }, function (err) {
      assert(err.message, 'DS.inject(resourceName, attrs[, options]): attrs: Must contain the property specified by `idAttribute`!');
      assert.deepEqual(DS.filter('post', {}), [], 'The posts should not be in the store');
    });

    $httpBackend.flush();

    assert($log.error.logs[0][0].message, 'DS.inject(resourceName, attrs[, options]): attrs: Must contain the property specified by `idAttribute`!');
    assert.equal(lifecycle.beforeInject.callCount, 0, 'beforeInject should not have been called');
    assert.equal(lifecycle.afterInject.callCount, 0, 'afterInject should not have been called');
  });
  it('should query the server for a collection but not store the data if cacheResponse is false', function () {
    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/posts\??/).respond(200, [p1, p2, p3, p4]);

    DS.findAll('post', {}, { cacheResponse: false }).then(function (data) {
      assert.deepEqual(data, [p1, p2, p3, p4]);
    }, function (err) {
      console.error(err.stack);
      fail('Should not have rejected!');
    });

    $httpBackend.flush();

    assert.deepEqual(DS.filter('post', {}), [], 'The posts should not have been injected into the store');

    assert.equal(lifecycle.beforeInject.callCount, 0, 'beforeInject should have been called');
    assert.equal(lifecycle.afterInject.callCount, 0, 'afterInject should have been called');
    assert.equal(lifecycle.serialize.callCount, 0, 'serialize should have been called');
    assert.equal(lifecycle.deserialize.callCount, 1, 'deserialize should have been called');
  });
  it('should correctly propagate errors', function () {
    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/posts\??/).respond(404, 'Not Found');

    DS.findAll('post', {}).then(function () {
      fail('Should not have succeeded!');
    }, function (err) {
      assert.equal(err.data, 'Not Found');
    });

    $httpBackend.flush();
  });
  it('"params" argument is optional', function () {
    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/posts\??/).respond(200, [p1, p2, p3, p4]);

    DS.findAll('post').then(function (data) {
      assert.deepEqual(data, [p1, p2, p3, p4]);
    }, function (err) {
      console.error(err.message);
      fail('Should not have rejected!');
    });

    $httpBackend.flush();

    assert.deepEqual(DS.filter('post', {}), [p1, p2, p3, p4], 'The posts are now in the store');

    assert.equal(lifecycle.beforeInject.callCount, 4, 'beforeInject should have been called');
    assert.equal(lifecycle.afterInject.callCount, 4, 'afterInject should have been called');
    assert.equal(lifecycle.serialize.callCount, 0, 'serialize should have been called');
    assert.equal(lifecycle.deserialize.callCount, 1, 'deserialize should have been called');
  });
  it('"params"', function () {
    $httpBackend.expectGET('http://test.angular-cache.com/posts?where=%7B%22author%22:%22Adam%22%7D').respond(200, [p4, p5]);

    var params = {
      where: {
        author: 'Adam'
      }
    };
    DS.findAll('post', params).then(function (data) {
      assert.deepEqual(data, [p4, p5]);
    }, function (err) {
      console.error(err.message);
      fail('Should not have rejected!');
    });

    $httpBackend.flush();

    assert.deepEqual(DS.filter('post', params), [p4, p5], 'The posts are now in the store');
    assert.deepEqual(DS.filter('post', {
      where: {
        id: {
          '>': 8
        }
      }
    }), [p5], 'The posts are now in the store');

    assert.equal(lifecycle.beforeInject.callCount, 2, 'beforeInject should have been called');
    assert.equal(lifecycle.afterInject.callCount, 2, 'afterInject should have been called');
    assert.equal(lifecycle.serialize.callCount, 0, 'serialize should have been called');
    assert.equal(lifecycle.deserialize.callCount, 1, 'deserialize should have been called');
  });
  it('should return already injected items', function () {
    var u1 = {
        id: 1,
        name: 'John'
      },
      u2 = {
        id: 2,
        name: 'Sally'
      };

    DS.defineResource({
      name: 'person',
      endpoint: 'users',
      methods: {
        fullName: function () {
          return this.first + ' ' + this.last;
        }
      }
    });

    $httpBackend.expectGET(/http:\/\/test\.angular-cache\.com\/users\??/).respond(200, [u1, u2]);

    DS.findAll('person').then(function (data) {
      assert.deepEqual(data, [
        DSUtils.deepMixIn(new DS.definitions.person[DS.definitions.person.class](), u1),
        DSUtils.deepMixIn(new DS.definitions.person[DS.definitions.person.class](), u2)
      ]);
      angular.forEach(data, function (person) {
        assert.isTrue(person instanceof DS.definitions.person[DS.definitions.person.class], 'should be an instance of User');
      });
    }, function (err) {
      console.error(err.message);
      fail('Should not have rejected!');
    });

    $httpBackend.flush();

    assert.deepEqual(DS.filter('person'), [
      DSUtils.deepMixIn(new DS.definitions.person[DS.definitions.person.class](), u1),
      DSUtils.deepMixIn(new DS.definitions.person[DS.definitions.person.class](), u2)
    ], 'The users are now in the store');

    assert.equal(lifecycle.beforeInject.callCount, 2, 'beforeInject should have been called');
    assert.equal(lifecycle.afterInject.callCount, 2, 'afterInject should have been called');
    assert.equal(lifecycle.serialize.callCount, 0, 'serialize should have been called');
    assert.equal(lifecycle.deserialize.callCount, 1, 'deserialize should have been called');
  });
  it('should handle nested resources', function () {
    var testComment = {
      id: 5,
      content: 'test',
      approvedBy: 4
    };
    var testComment2 = {
      id: 6,
      content: 'test',
      approvedBy: 4
    };
    $httpBackend.expectGET('http://test.angular-cache.com/user/4/comment?content=test').respond(200, [testComment, testComment2]);

    DS.findAll('comment', {
      content: 'test'
    }, {
      params: {
        approvedBy: 4
      }
    }).then(function (comments) {
      assert.deepEqual(comments, [testComment, testComment2]);
      assert.deepEqual(comments, DS.filter('comment', {
        content: 'test'
      }));
    }, function () {
      fail('Should not have failed!');
    });

    $httpBackend.flush();

    DS.ejectAll('comment');

    $httpBackend.expectGET('http://test.angular-cache.com/comment?content=test').respond(200, [testComment, testComment2]);

    DS.findAll('comment', {
      content: 'test'
    }, {
      bypassCache: true
    }).then(function (comments) {
      assert.deepEqual(comments, [testComment, testComment2]);
      assert.deepEqual(comments, DS.filter('comment', {
        content: 'test'
      }));
    }, function () {
      fail('Should not have failed!');
    });

    $httpBackend.flush();

    DS.ejectAll('comment');

    $httpBackend.expectGET('http://test.angular-cache.com/comment?content=test').respond(200, [testComment, testComment2]);

    DS.findAll('comment', {
      content: 'test'
    }, {
      bypassCache: true,
      params: {
        approvedBy: false
      }
    }).then(function (comments) {
      assert.deepEqual(comments, [testComment, testComment2]);
      assert.deepEqual(comments, DS.filter('comment', {
        content: 'test'
      }));
    }, function () {
      fail('Should not have failed!');
    });

    $httpBackend.flush();
  });
});
