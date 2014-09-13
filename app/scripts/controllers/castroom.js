'use strict';

var app = angular.module('livesApp')
.controller('CastroomCtrl', function ($scope, Resource, $routeParams) {
    $scope.username = $routeParams.username;
    $scope.chatpool = [];
    for(var i = 0; i < 10; ++i) {
        $scope.chatpool.push({username : 'CANCAN', content : 'Yes, I love it, too'});
    }
    $scope.saySth = function($event) {
        if($scope.chatContent === '') {
            return;
        }
        $scope.chatpool.push({username : 'YAOYAO', content : $scope.chatContent });
        $scope.$broadcast('ChatpoolChanged', $scope.chatId);
        $scope.chatContent = '';
        $event.preventDefault();
    }; 
    var userResource = Resource.getResource('user/:id');
    $scope.caster = userResource.get({id: 1}, function(res) {
        console.log(res);
        return res;
    });
});

app.directive('chatPool', function() {
    return {
        controller:function($scope, $element) {
            $scope.$on('ChatpoolChanged', function() {
                var pool = $element[0];
                console.log(pool);
                pool.scrollTop = pool.scrollHeight;
            });
        }
    };
});

app.directive('subscribeBtn', function(Resource, Session) {
    return {
        scope: {
            caster: '=caster',
        },
        link: function(scope, ele, attrs) {
            var subCheckResource = Resource.getResource('subscribe/check');
            console.log('logging user');
            console.log(scope.caster);
            scope.caster.$promise.then(function() {
            subCheckResource.get({from_id: Session.getUserId(), to_id: scope.caster.userId},
                function(result) {
                    console.log(result);
                    if(result.result === 'true') {
                        ele.addClass('disabled');
                        ele.removeClass('btn-primary');
                        ele.html('已订阅');
                    } 
                });
            });
            ele.bind('click', function() {
                if(scope.isDisabled) {return;}
                var subscribeResource = Resource.getResource('subscribe');
                subscribeResource.get({from_id: Session.getUserId(), to_id: scope.caster.userId},
                    function(result) {
                        console.log('Subscribe processing');
                        console.log(result);
                    }
                );
            });
        }
    };
});

app.directive('addOneButton', function() {
    return {
        scope: {
            caster: '=caster'  
        },
        link: function(scope, ele, attrs) {
            //ele.$watch(Se)
            //ele.bind('click') 
        }
    };
    
});
