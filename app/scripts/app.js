'use strict';

/**
 * @ngdoc overview
 * @name livesApp
 * @description
 * # livesApp
 *
 * Main module of the application.
 */
var app = angular
.module('livesApp', [
//    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap'
])
.config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/personal', {
        templateUrl: 'views/personal.html',
        controller: 'PersonalCtrl'
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl'
      })
      .when('/category/:category', {
        templateUrl: 'views/category.html',
        controller: 'CategoryCtrl'
      })
      .when('/cast', {
        templateUrl: 'views/cast.html',
        controller: 'CastCtrl'
      })
      .when('/castroom/:username', {
        templateUrl: 'views/castroom.html',
        controller: 'CastroomCtrl'
      })
      .when('/join', {
        templateUrl: 'views/join.html',
        controller: 'PersonalCtrl'
      })
      .when('/favor', {
        templateUrl: 'views/favor.html',
        controller: 'PersonalCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
});

app.constant('USER_ROLES', {
    all: '*',
    admin: 'admin',
    roomAdmin: 'room-admin',
    user: 'user'
})
.constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
})
.constant('RUN_MODES', {
    testing: 'test',
    running: 'remote'
})
.constant('ERROR_INFO', {
    USERNAME_NOT_EXIST : 'Username not existed',
    USERNAME_PASSWORD_NOT_MATCHED : 'Credentials not available',
    USERNAME_NOT_VALID : 'Username not valid',
    PASSWORD_NOT_VALID : 'Password not valid'
});

app.run(function($rootScope, Session, TagService, AuthService, Resource) {
    $rootScope.isAuth = AuthService.isAuthenticated();
    $rootScope.$watch(AuthService.isAuthenticated(), function() {
        console.log(AuthService.isAuthenticated());
        $rootScope.isAuth = AuthService.isAuthenticated();
    });

    var categories = Resource.getResource('tag').query();
    categories.$promise.then(function() {
        TagService.setTags(categories);
        console.log(TagService.tags);
    });
   
    $rootScope.$on('UserActionOccur', function(e, d) {
        console.log('User action occur');
        console.log(e);
        console.log(d);
        var send = Resource.getResource('action/receive');
        var action = {userId: Session.getUserId(), vid: d.liveId, type: 1, 
            time: dateFormat('yyyy-MM-dd hh:mm:ss')};
        send.save(action, function(res) {
            if(res.result === 'success') {
                console.log(res);
            }
        });
    });

});

app.service('Server', function(RUN_MODES) {
    this.serverAddress = {
        testServer: 'http://localhost:8080/LivesServer/rest/:api',
        remoteServer: 'http://223.3.80.99:8080/LivesServer/rest/:api'
    };
    this.getServerAddress = function(status) {
        status = typeof status !== 'undefined' ? status : RUN_MODES.running;
        switch(status) {
            case RUN_MODES.testing:
                return this.serverAddress.testServer;
            case RUN_MODES.running:
                return this.serverAddress.remoteServer;
        }
    }; 
    return this;
});

app.service('Session', function($window) {
    this.create = function(sid, user) {
        $window.sessionStorage.sessionId = sid;
        $window.sessionStorage.user = angular.toJson(user);
        $window.sessionStorage.dirty = false;
    };
    this.destroy = function() {
        $window.sessionStorage.sessionId = null;
        $window.sessionStorage.user = null;
        $window.sessionStorage.dirty = false;
    };
    this.getUser = function() {
        return angular.fromJson($window.sessionStorage.user);
    };
    this.setNewTags = function(tagStr) {
        var user = angular.fromJson($window.sessionStorage.user);
        user.tags = tagStr;
        $window.sessionStorage.user = angular.toJson(user);
    };
    this.getUserId = function() {
        var user = this.getUser();
        return user.userId;    
    };
    this.setSessionId = function(newSessionId) {
        $window.sessionStorage.sessionId = newSessionId;
    };
    this.getSessionId = function() {
        return $window.sessionStorage.sessionId;    
    };
    this.getUserRole = function() {
        var user = this.getUser();
        return user.userRole;
    };
    this.setDirty = function() {
        $window.sessionStorage.dirty = true;    
    };
    this.isDirty = function() {
        return $window.sessionStorage.dirty;    
    };
});

app.service('Resource', function($http, $resource, Server) {
    this.getResource = function(resName) {
        //$http.defaults.headers.common['hehe'] = 'access_token';
        var res = $resource(Server.getServerAddress() + '/' + resName);
        //res = TokenHandler.tokenWrapper(res);
        return res;
    }; 
});

app.service('AuthService', function($rootScope, Session, Resource, AUTH_EVENTS) {
    this.login = function(user) {
        var authResource = Resource.getResource('auth');
        return authResource.save(user, function(result) {
            if(result.result !== 'failure') {
                Session.create(result.result, result.object);
                console.log('Creating session');
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            }
            return result;
        });
    };
    this.logout = function() {
        Session.destroy();
        $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
    };

    this.isAuthenticated = function() {
        if(Session.getSessionId() === 'null') {
            console.log('SessionId now is null');
            return false;    
        }
        else if(typeof Session.getSessionId() === 'undefined') {
            console.log('SessionId is undefined');
            return false;
        }
        return true;
    };

    this.isAuthorized = function(authorizedRoles) {
        if(angular.isArray(authorizedRoles) === false) {
            authorizedRoles = [authorizedRoles];    
        }    
        return (this.isAuthenticated() &&
            authorizedRoles.indexOf(Session.getUserRole()) !== -1);
    };
});

app.service('UserService', function(Resource) {
    var userHash = [];
    this.getUserById = function(id) {
        for(var user in userHash) {
            if(user.userId === id) {
                console.log('Get user by id from userHash: ');
                console.log(user);
                return user;    
            }    
        }
        var uR = Resource.getResource('user/:userId');
        return uR.get({userId: id}, function(res) {
            console.log('Get user by id by Remote: ') ;
            console.log(res);
            userHash.push(res);
            return res;
        });
    }; 
});

app.factory('TagService', function(Resource) {
    var tagService = {};
    tagService.setTags = function(tags) {
        tagService.tags = tags;        
    };

    tagService.getTag = function(name) {
        for(var i in tagService.tags) {
            if(tagService.tags[i].tagNameEng === name) {
                console.log('Get cate by id from categoryHash: ');
                console.log(tagService.tags[i]);
                return tagService.tags[i];    
            }    
        }
    };
    return tagService;
});
