'use strict';

var app = angular.module('livesApp')
.controller('SearchCtrl', function($scope, Resource, SearchService, $routeParams) {
    var pageLoader = {};
    pageLoader.load = function() {
        $scope.lives = SearchService.searchLives();
        $scope.users = SearchService.searchUsers();
        $scope.cachedVideos = SearchService.searchCachedVideos();
    };
    $scope.isLoad = false;
    if(SearchService.isSearchAvailable()) {
        $scope.isLoad = true;
        pageLoader.load();    
    }
    $scope.$on('searchPageReload', function() {
        console.log('page reloaded');
        $scope.isLoad = true;
        pageLoader.load(); 
    });
});

app.service('SearchService', function(Resource, TagService) {
    this.setSearchContent = function(searchContent) {
        this.key = searchContent;    
    };

    this.isSearchAvailable = function() {
        return !(this.key === null || typeof this.key === 'undefined');    
    };

    this.searchResource = Resource.getResource('search/:category');
    this.searchLives = function() {
        return this.searchResource.query({category: 'live', content: this.key}, function(res) {
            console.log('Search Lives Data:');
            var userResource = Resource.getResource('user/:id');
            angular.forEach(res, function(item) {
                if(item.thumbnail === null) {
                    var tag = TagService.getTagById(item.tag);
                    item.thumbnail = tag.thumbnailBig;    
                }
                userResource.get({id: item.userId}, function(res) {
                    item.username = res.username; 
                });
            });
            console.log(res);
            return res; 
        });
    }; 
    this.searchUsers = function() {
        return this.searchResource.query({category: 'user', content: this.key}, function(res) {
            console.log('Search Users Data:');
            console.log(res);
            return res; 
        });
    }; 
    this.searchCachedVideos = function() {
        return this.searchResource.query({category: 'cached', content: this.key}, function(res) {
            console.log('Search Caches Data:');
            console.log(res);
            angular.forEach(res, function(item) {
                if(item.thumbnail === null) {
                    var tag = TagService.getTagById(item.tag);
                    item.thumbnail = tag.thumbnailBig;    
                }
            });
            return res; 
        });
    }; 
});
