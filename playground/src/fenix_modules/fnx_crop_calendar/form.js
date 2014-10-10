define(['jquery',
    'mustache',
    'text!fnx_crop_calendar/html/index.html',
    'text!fnx_crop_calendar/css/datepicker3.css',
    'chosen',
    'bootstrap-datepicker',
    'bootstrap'], function ($, Mustache, template, datepicker_style) {

    'use strict';

    function FNX_CROP_CALENDAR_FORM() {
        this.CONFIG = {

            "uuid" : null,
            lang : 'en',
            "placeholder"   : "fnx_cc_form_id",

            "form" : {
                "crop_type"             : "crop_type",
                "crop_variery"          : "crop_variery",
                "timerange" : {
                    "growing_timeperiod": "growing_timeperiod",
                    "sowing_timeperiod": "sowing_timeperiod",
                    "harvesting_timeperiod": "harvesting_timeperiod"
                }
            }
        };
    }

    FNX_CROP_CALENDAR_FORM.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);
        this.CONFIG.uuid = this.generateUUID()
        this.create_form()
    }

    FNX_CROP_CALENDAR_FORM.prototype.create_form = function(config) {
        var suffix = this.CONFIG.uuid
        var t = $(template).filter('#structure_crop_form').html();
        if ( !this.CONFIG.uuid )
            this.CONFIG.uuid = this.generateUUID()
        var view = {id : suffix}
        var render = Mustache.render(t, view);
        $("#" + this.CONFIG.placeholder).html(render)

        // add time range
        this.add_timerange(this.CONFIG.form.timerange.growing_timeperiod + suffix)
        this.add_timerange(this.CONFIG.form.timerange.sowing_timeperiod + suffix)
        this.add_timerange(this.CONFIG.form.timerange.harvesting_timeperiod + suffix)

        // add chosen
        $('#' +this.CONFIG.form.crop_type + suffix).chosen({disable_search_threshold:6, height:'100%', width: '100%'});
    };

    FNX_CROP_CALENDAR_FORM.prototype.fill_form = function() {
        // TODO: pass the json
    }

    FNX_CROP_CALENDAR_FORM.prototype.add_timerange = function(id) {
        var t = $(template).filter('#structure_time_period').html();
        var view = {id : this.CONFIG.suffix_id}
        var render = Mustache.render(t, view);
        $("#" + id).html(render)
    }

    FNX_CROP_CALENDAR_FORM.prototype.generateUUID = function() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    };

    FNX_CROP_CALENDAR_FORM.prototype.getUUID = function() {
        return this.CONFIG.uuid;
    }
    FNX_CROP_CALENDAR_FORM.prototype.getJSON = function() {
        return { "test" : "test"}
    }

    return FNX_CROP_CALENDAR_FORM;
});