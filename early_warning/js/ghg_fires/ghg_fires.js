define(['jquery',
    'mustache',
    'text!../../html/ghg_fires/template.html',
    'loglevel',
    'fenix-map',
    'fenix-map',
    'highcharts',
    'ghg_fires_chart',
    'bootstrap'], function ($, Mustache, templates, log) {

    var global = this;
    global.GHG_Fires = function() {

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

        var CONFIG = {
            lang: 'EN',
            placeholder: 'main_content_placeholder',
            template_id: 'map',

            url_geoserver_wms: 'http://168.202.28.214:9090/geoserver/wms',

            url_search_layer_product: "http://168.202.28.214:5005/search/layer/product/",

            url_search_layer_product_type: "http://168.202.28.214:5005/search/layer/product/{{PRODUCT}}/type/{{TYPE}}/",

            url_spatialquery: "http://168.202.28.214:5005/spatialquery/db/spatial/",

            url_stats_raster: "http://168.202.28.214:5005/stats/raster/spatial_query",
            url_stats_rasters: "http://168.202.28.214:5005/stats/rasters/spatial_query",

        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                $('#' + CONFIG.placeholder).html(templates);

                create_chart();
            });
        }



        var create_chart= function() {
            var url = "http://168.202.28.214:5005/stats/raster/fenix:burned_landtype_burundi/hist/buckets/16/min/1/max/16.0"
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    console.log(response);


                    var categories = [
                        "evergreen needleleaf forest",
                        "evergreen broadleaf forest",
                        "deciduous needleleaf forest",
                        "deciduous broadleaf forest",
                        "mixed forests",
                        "closed shrubland",
                        "open shrublands",
                        "woody savannas",
                        "savannas",
                        "grasslands",
                        "permanent wetlands",
                        "croplands",
                        "urban and built-up",
                        "cropland/natural vegetation mosaic",
                        "snow and ice",
                        "barren or sparsely vegetated"
                    ]
                    var series = []

                    series.push({"name" : "Land Type", "data" : response[0].values })



                    console.log("series");
                    console.log(series);
                    var chart = {
                        "categories" : categories,
                        "series" : series
                    }
                    console.log(chart);
                    EW_CHART.createTimeserie(chart, "ghg_fires_chart", "column")
                },
                error : function(err, b, c) {}
            });

        }

        // public instance methods
        return {
            build: build
        };
    };

});