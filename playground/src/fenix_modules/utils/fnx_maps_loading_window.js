define(['jquery'], function () {

    'use strict';

    function FNX_MAPS_LOADING_WINDOW() {
        var loadingWindow;
        loadingWindow = loadingWindow || (function () {
            var pleaseWaitDiv = $('' +
                '<div class="modal" id="pleaseWaitDialog" style="background-color: rgba(54, 25, 25, 0.1);" data-backdrop="static" data-keyboard="false">' +
                '<div class="modal-body" style="color:#F0F0F0"><h1>Processing...</h1><i class="fa fa-refresh fa-spin fa-5x"></i></div>' +
                '</div>');
            return {
                showPleaseWait: function() {
                    pleaseWaitDiv.modal();
                },
                hidePleaseWait: function () {
                    pleaseWaitDiv.modal('hide');
                }
            };
        })();

        this.loadingWindow = loadingWindow;
    }

    FNX_MAPS_LOADING_WINDOW.prototype.showPleaseWait = function(config) {
        this.loadingWindow.showPleaseWait()
    };

    FNX_MAPS_LOADING_WINDOW.prototype.hidePleaseWait = function(config) {
        this.loadingWindow.hidePleaseWait()
    };

    return FNX_MAPS_LOADING_WINDOW;
});