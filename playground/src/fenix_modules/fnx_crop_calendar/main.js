define(['jquery',
    'mustache',
    'fnx_crop_calendar/form',
    'text!fnx_crop_calendar/html/index.html',
    'text!fnx_crop_calendar/css/datepicker3.css',
    'chosen',
    'fenix-map',
    'bootstrap-datepicker',
    'bootstrap'], function ($, Mustache, FNX_CROP_CALENDAR_FORM, template, datepicker_style) {

    'use strict';

    function FNX_CROP_CALENDAR() {
        this.CONFIG = {
            lang : 'en',


            "placeholder"   : "main_content_placeholder",

            "map_id"   : "fnx_cc_map_id",

            "form_id"   : "fnx_cc_form_id",

            "form" : {
                "fnx_crop_type"             : "fnx_crop_type",
                "fnx_crop_variery"          : "fnx_crop_variery",
                "fnx_growing_timeperiod"    : "fnx_growing_timeperiod",
                "fnx_sowing_timeperiod"     : "fnx_sowing_timeperiod",
                "fnx_harvesting_timeperiod" : "fnx_harvesting_timeperiod"
            },

            markers: {}

        };
    }

    FNX_CROP_CALENDAR.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);
        var styleText = '<style>' + datepicker_style + '</style>'
        var t = $(template).filter('#structure').html();
        $("#" + this.CONFIG.placeholder).empty()
        $("#" + this.CONFIG.placeholder).append(styleText)
        $("#" + this.CONFIG.placeholder).append(t)

        // create_map
        var m = this.create_map(this.CONFIG.map_id)
    };

    FNX_CROP_CALENDAR.prototype.add_style = function(styleText) {
        console.log(styleText);
        var style = document.createElement("style");
        style.type = "text/css";
        style.appendChild(styleText);
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);
    };

    FNX_CROP_CALENDAR.prototype.randomID = function() {
        var randLetter = Math.random().toString(36).substring(7);
        return (randLetter + Date.now()).toLocaleLowerCase();
    }

    FNX_CROP_CALENDAR.prototype.create_map = function(id) {
        var options = {
            plugins: { geosearch : true, mouseposition: false, controlloading : true, zoomControl: 'bottomright'},
            guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
            gui: {disclaimerfao: true }
        }

        var mapOptions = { zoomControl:false,attributionControl: false };
        var m = new FM.Map(id, options, mapOptions);
        m.createMap();

        var layer = {};
        layer.layers = "fenix:gaul0_line_3857"
        layer.layertitle = "Boundaries"
        layer.urlWMS = "http://fenixapps2.fao.org/geoserver-demo"
        layer.styles = "gaul0_line"
        layer.opacity='0.7';
        var l = new FM.layer(layer);
        m.addLayer(l);

        var _this = this;
        m.map.on('click', function(e){
            _this.addMarker(e)
        });

        // caching map
        return this.CONFIG.m = m;
    };

    FNX_CROP_CALENDAR.prototype.addMarker = function(e) {
        console.log("add marker");
        var marker =  L.marker(e.latlng)
        this.CONFIG.m.map.addLayer(marker)

        var form = new FNX_CROP_CALENDAR_FORM();
        form.init()
        var uuid = form.getUUID()
        marker.uuid = uuid
        this.CONFIG.markers[uuid] = {
            uuid : form.getUUID(),
            form : form.getJSON(),
            marker : marker
        }

        console.log(this.CONFIG.markers);
        marker.on('click', this.onMarkerClick);
    }

    FNX_CROP_CALENDAR.prototype.onMarkerClick = function(e) {
        console.log("onMarkerClick");
        console.log(e.target.uuid);
        console.log(this);
        console.log(this.CONFIG.markers);
        // open popup

        var marker_def = this.CONFIG.markers[event.target.uuid];

        console.log(marker_def);

        // open form?
        var form = new FNX_CROP_CALENDAR_FORM();
        form.init()
    }

    return FNX_CROP_CALENDAR;
});