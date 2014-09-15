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
            url_stats_rasters: "http://168.202.28.214:5005/stats/rasters/spatial_query"

        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                $('#' + CONFIG.placeholder).html(templates);

                build_dropdown_gaul("ghg_fires_gaul_dropdown");

                //create_chart("ghg_fires_chart", "label", "976");
//                create_chart("977");
            });
        }


        var build_dropdown_gaul = function(id) {
            var query = "SELECT adm0_code, adm0_name FROM spatial.gaul0_3857 WHERE disp_area = 'NO' ORDER BY adm0_name"
            var url = CONFIG.url_spatialquery + query
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    var dropdowndID = id + "_select"
                    var html = '<select id="'+ dropdowndID+'" style="width:100%;">';
                    html += '<option value=""></option>';
                    for(var i=0; i < response.length; i++) {
                        html += '<option value="' + response[i][0] + '">' + response[i][1] + '</option>';
                    }
                    html += '</select>';

                    $('#' + id).empty();
                    $('#' + id).append(html);

                    try {
                        $('#' + dropdowndID).chosen({disable_search_threshold:6, width: '100%'});
                    }  catch (e) {}

                    $( "#" + dropdowndID ).change(function () {
//                        collector_to_build_stats()
//                        console.log(this);
//                        layer.layers = $(this).val()
//                        layer.layertitle = $("#" + dropdowndID + " :selected").text();
                        get_gauls1_from_gaul0($(this).val())
                    });
                },
                error : function(err, b, c) {}
            });
        }

        var get_gauls1_from_gaul0 = function(gaul0_code) {
            $("#ghg_fires_charts_container").empty();
            var query = "SELECT adm1_code, adm1_name FROM spatial.gaul1_3857 WHERE adm0_code IN ('"+ gaul0_code +"')"
            var url = CONFIG.url_spatialquery + query
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    for (var i=0; i < response.length; i++) {
                        var id = randomID();

                        // chart html template
                        var html = "<div class='row'>" +
                            "<h5 class='col-xs-12 text-primary'>"+ response[i][1] +"</h5>" +
                            "</div>"
                        html += "<div class='row'>"
                        html += "<div id='" + id + "'><i class='fa fa-refresh fa-spin fa-5x'></i></div>"
                        html += "</div>"
                        $("#ghg_fires_charts_container").append(html);
                        create_chart(id, response[i][0], response[i][1])
                    }
                },
                error : function(err, b, c) {}
            });

        }


        var create_chart = function(chart_id, code, label) {
            console.log("---CReate chart--");
            console.log(code);
            console.log(label);
            var url = "http://168.202.28.214:5005/ghg/rasters/burned_areas/fenix:burned_areas_182_2014/land_cover/fenix:land_cover_maryland_2009/gaul/1/codes/" +code
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
                    var series_values = []
                    var pixel_constant = 250000
                    // check if there is at least one value
                    var check_serie = false;
                    for (var i=0; i < response[0].values.length; i++) {
                        if ( response[0].values[i] != "") {
                            check_serie = true;
                            break;
                        }
                    }

                    if( check_serie ) {
                        for (var i=0; i < response[0].values.length; i++) {
                            series_values.push(response[0].values[i]*pixel_constant)
                        }

                        series.push({"name": "Land Type", "data": series_values })
                        var chart = {
                            "categories": categories,
                            "series": series,
                            "yAxis" : {
                                "title" : {
                                    "text" : "km^2"
                                }
                            }
                        }
                        console.log(chart);
                        $("#" + chart_id).css("height", "450px")
//                        $("#" + chart_id).css("width", "350px")
                        EW_CHART.createTimeserie(chart, chart_id, "column")
                    }
                    else {
                        $("#" + chart_id).html("<h6 class='col-xs-12 text-warning'>No burned areas found </h6>")
                    }
                },
                error : function(err, b, c) {}
            });
        }

        var randomID = function() {
            var randLetter = Math.random().toString(36).substring(7);
            return (randLetter + Date.now()).toLocaleLowerCase();
        }

        // public instance methods
        return {
            build: build
        };
    };

});