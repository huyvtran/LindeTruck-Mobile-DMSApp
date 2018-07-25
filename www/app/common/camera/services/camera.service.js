/**
 * Module oinio.services ImageService
 */
angular.module('oinio.common.camera')
    .service('CameraService', function CameraService($q, $cordovaCamera) {
        var service = this;

        /**
         *
         * @param type
         * @returns {{destinationType: number, sourceType: *, allowEdit: boolean, encodingType: number, popoverOptions: CameraPopoverOptions, saveToPhotoAlbum: boolean}}
         */
        function optionsForType(type) {
            var source;
            switch (type) {
                case 0:
                    source = Camera.PictureSourceType.CAMERA;
                    break;
                case 1:
                    source = Camera.PictureSourceType.PHOTOLIBRARY;
                    break;
            }

            return {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: source,
                allowEdit: false,
                encodingType: Camera.EncodingType.JPEG,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                targetWidth: 600,
                correctOrientation: true
            };
        }

        /**
         *
         * @return {*|promise}
         */
        service.takePhoto = function (sourceType) {

            var deferred = $q.defer();

            var options = optionsForType(sourceType);

            $cordovaCamera.getPicture(options).then(function (imageData) {
                deferred.resolve(imageData);
            });

            return deferred.promise;
        };
    });
