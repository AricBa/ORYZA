(function (angular) {
    "use strict";

    var app = angular.module('myApp.home', ['ionic', 'firebase.simpleLogin',
        'firebase.utils', 'firebase']);
    app

        .controller('sideBarCtrl', function (localStorageService,
                                             $scope, $state, $translate, $q, homeFactory, ionicLoading) {
            $scope.changeLanguage = function (langKey) {
                console.log(langKey);
                $translate.use(langKey);
            };
            //ionicLoading.load();

        })
        .controller('homeCtrl', function (fbutil, $q, localStorageService, homeFactory,
                                          $scope, $state, $log, $rootScope, ionicLoading, $ionicSideMenuDelegate, events) {

            $scope.openMenu = function () {
                //ionicLoading.load();
                $ionicSideMenuDelegate.toggleLeft();
                //homeFactory.ready('A0001').then(function (data) {
                //    $rootScope.SAPUser = data[0].SAP_USER;
                //})
                //    .catch(function (error) {
                //        console.log(error);
                //        $rootScope.SAPUser = 'Null';
                //        //$scope.text=error;
                //    }).finally(function(){
                //        ionicLoading.unload();
                //    }
                //);
            };


            $scope.viewtitle = angular.uppercase($state.current.name);
//        ionicLoading.load();
            function scopeInit() {
                //var events = ['E0001', 'E0002', 'E0004', 'E0005'];
                angular.forEach(events, function (event) {
                        //console.log(event);
                        var str = localStorageService.get(event);

                        if (typeof  str !== 'undefined'
                            && str !== null) {
                            //console.log(str);
                            $scope[event] = str;
                        } else {
                            homeFactory.ready(event).then(function (data) {
                                //console.log(data);
                                $scope[event] = data;

                                localStorageService.set(event, $scope[event]);
                            });
                        }
                        //console.log($scope.$eval(event));
                    }
                );
            }

            scopeInit();
            $scope.$state = $state;

            $scope.$on('$viewContentLoaded', function () {
//            ionicLoading.load('Loading');
                $log.info('has loaded');
            });
            $scope.refresh = function () {
                localStorageService.remove('E0001', 'E0002', 'E0004', 'E0005');
                scopeInit();
                console.log('$scope.refresh');
                $scope.$broadcast('scroll.refreshComplete');
            };
            $scope.$log = $log;

            $scope.$on('$destroy', function () {
//            ionicLoading.unload();
                $log.info('is no longer necessary');
            });
        });

    app.factory('homeFactory',
        function ($rootScope, $firebaseObject, fbutil, $q) {
            var homeFactory = {};
            homeFactory.ready = function (event) {

                var promises = [];
                var deffered = $q.defer();
                var user=$rootScope.firebaseSync.serverUserID;
                //console.log(user);
                //currentUser.getUser().then(function (user) {
                    console.log(user + ' ' + event);
                    fbutil.ref(['Event', event])
                        .startAt(user)
                        .endAt(user)
                        .once('value', function (snap) {

                            snap.child(user).ref().once('value', function (snap) {
                                if (event === 'A0001') {
                                    if (typeof snap.val() == "undefined" ||
                                        snap.child('TASK_INFO').child('task_status').val() !== '3') {
                                        deffered.reject('no data');

                                    } else {
                                        deffered.resolve({
                                            "serverUserID": user,
                                            "SAP_LANGUAGE": snap.child('TASK_INFO').child('SAP_LANGUAGE').val(),
                                            "SAP_PASSWORD": snap.child('TASK_INFO').child('SAP_PASSWORD').val(),
                                            "SAP_USER": snap.child('TASK_INFO').child('SAP_USER').val(),
                                            "task_status": snap.child('TASK_INFO').child('task_status').val()
                                        });

                                    }
                                }
                                if (event !== 'A0001') {

                                    var Array = [];
                                    snap.forEach(function (childSnapshot) {
                                        Array.push({
                                            "name": childSnapshot.key(),
                                            "url": childSnapshot.ref().toString().replace(childSnapshot.ref().root().toString(), '')
                                        });
                                    });
                                    var node = {
                                        "name": event,
                                        "show": true,
                                        "url": snap.ref().toString().replace(snap.ref().root().toString(), ''),
                                        "array": Array
                                    };
                                    if (Array.length === 0) {
                                        node.show = false
                                    }
                                    console.log(node);
                                    deffered.resolve(node);
                                }
                            }, function (err) {
                                // code to handle read error
                                deffered.reject({
                                    "event": event,
                                    "error": err
                                });
                            });
                        });
                //});


                promises.push(deffered.promise);
                return $q.all(promises);
            };

            return homeFactory;
        });

    app.config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                //views: {
                //'messages-tab': {
                templateUrl: 'scripts/home/home.html',
                controller: 'homeCtrl',

                //}
                //},
                //cache: false,
                //}

                resolve: {
                    // controller will not be loaded until $requireAuth resolves
                    // Auth refers to our $firebaseAuth wrapper in the example above
                    "currentAuth": ["simpleLogin",
                        function (simpleLogin) {
                            // $requireAuth returns a promise so the resolve waits for it to complete
                            // If the promise is rejected, it will throw a $stateChangeError (see above)
                            return simpleLogin.auth.$requireAuth();
                        }]
                    ,
                    events: function () {
                        return ['E0001', 'E0004'];
                    }
                }
            })
            .state('notification', {
                url: '/notification',
                templateUrl: 'scripts/home/notification.html',
                controller: 'homeCtrl',

                resolve: {
                    "currentAuth": ["simpleLogin",
                        function (simpleLogin) {
                            return simpleLogin.auth.$requireAuth();
                        }]
                    ,
                    events: function () {
                        return ['E0002', 'E0005'];
                    }
                }
            });
    }]);
})(angular);