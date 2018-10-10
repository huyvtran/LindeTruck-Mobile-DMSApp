angular.module('oinio.serviceManagementController', [])
    .controller('serviceManagementController', function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                                                   LocalCacheService) {
        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        vm.isOnline = null;
        $scope.$on('$ionicView.beforeEnter', function () {
            $scope.imgUris1 = ["././img/images/will_add_Img.png"];
            $scope.imgUris2 = ["././img/images/will_add_Img.png"];
        });


        $scope.$on('$ionicView.enter', function () {
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }

        });
        $scope.getPhoto1 = function ($event) {
            if ($event.target.getAttribute("id") != "././img/images/will_add_Img.png") {
                return false;
            }
            $ionicPopup.show({
                title: '选择图片',
                buttons: [
                    {
                        text: '拍照',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris1.length; i++) {
                                            if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i] == imgUri) {
                                                $scope.imgUris1.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris1.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris1.push("././img/images/will_add_Img.png");
                                        console.log(imgUri);
                                    },
                                    function onError(error) {
                                        return;
                                    }
                                    , {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    }
                                );
                            } catch (e) {
                                return;
                            }
                        }
                    },
                    {
                        text: '相册',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoURISuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris1.length; i++) {
                                            if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i] == imgUri) {
                                                $scope.imgUris1.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris1.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris1.push("././img/images/will_add_Img.png");
                                        console.log(imgUri);
                                    },
                                    function onFail(error) {
                                        return;
                                    },
                                    {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    });
                            } catch (e) {
                                return;
                            }

                        }
                    },
                ]
            });
        };

        $scope.getPhoto2 = function ($event) {
            if ($event.target.getAttribute("id") != "././img/images/will_add_Img.png") {
                return false;
            }
            $ionicPopup.show({
                title: '选择图片',
                buttons: [
                    {
                        text: '拍照',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris2.length; i++) {
                                            if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i] == imgUri) {
                                                $scope.imgUris2.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris2.push("././img/images/will_add_Img.png");
                                        console.log(imgUri);
                                    },
                                    function onError(error) {
                                        return;
                                    }
                                    , {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    }
                                );
                            } catch (e) {
                                return;
                            }
                        }
                    },
                    {
                        text: '相册',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoURISuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris2.length; i++) {
                                            if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i] == imgUri) {
                                                $scope.imgUris2.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris2.push("././img/images/will_add_Img.png");
                                        console.log(imgUri);
                                    },
                                    function onFail(error) {
                                        return;
                                    },
                                    {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    });
                            } catch (e) {
                                return;
                            }

                        }
                    },
                ]
            });
        };


        $scope.deleteCurrentImg1 = function (imgUri) {
            $ionicPopup.show({
                title: "确认删除图片？",
                buttons: [
                    {
                        text: "否",
                        onTap: function () {
                            return true;
                        }
                    },
                    {
                        text: "是",
                        onTap: function () {
                            for (var i = 0; i < $scope.imgUris1.length; i++) {
                                if ($scope.imgUris1[i] == imgUri) {
                                    $scope.imgUris1.splice(i, 1);
                                    i--;
                                }
                            }
                            return true;
                        }
                    }
                ]
            });

        };

        $scope.deleteCurrentImg2 = function (imgUri) {
            $ionicPopup.show({
                title: "确认删除图片？",
                buttons: [
                    {
                        text: "否",
                        onTap: function () {
                            return true;
                        }
                    },
                    {
                        text: "是",
                        onTap: function () {
                            for (var i = 0; i < $scope.imgUris2.length; i++) {
                                if ($scope.imgUris2[i] == imgUri) {
                                    $scope.imgUris2.splice(i, 1);
                                    i--;
                                }
                            }
                            return true;
                        }
                    }
                ]
            });

        };



        $scope.serviceManagementCancel =function () {
            window.history.back();
        };

        $scope.serviceManagementSubmit =function () {
            $state.go("app.home");
        };

    });
