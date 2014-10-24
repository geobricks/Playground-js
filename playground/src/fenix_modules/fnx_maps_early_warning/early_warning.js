define(['jquery',
    'mustache',
    'text!fnx_maps_early_warning/html/template.html',
    'fenix-map',
    'highcharts',
    'early_warning_chart',
    'bootstrap'], function ($, Mustache, templates) {

    var global = this;
    global.Early_warning = function() {

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


            // default layer and map
            m : null,
            l : null,

            l_gaul0: null,
            l_gaul1_highlight: null,

            // statistics

            //mean_threshold: 0.5,

            json_stats : {
                "raster": {
                    "name": null,
                    "uid": null
                },
                "vector": {
                    "name": "gaul1",
                    "type": "database",
                    "options": {
                        "query_condition": {
                            "select": "adm1_code, adm1_name",
                            "from": "{{SCHEMA}}.gaul1_3857",
                            "where": "adm0_code IN ({{ADM0_CODE}}) GROUP BY adm1_code, adm1_name ORDER BY adm1_name"
                        },
                        "column_filter": "adm1_code",
                        "stats_columns": {
                            "polygon_id": "adm1_code",
                            "label_en": "adm1_name"
                        }
                    }
                },
                "stats": {
                    "raster_stats": {
                        "descriptive_stats": {
                            "force": true
                        },
                        "histogram": {
                            "buckets": 256,
                            "include_out_of_range": 0,
                            "force": true
                        }
                    }
                }
            },

            json_stats_gaul1 : {
                "raster": {
                    "name": null,
                    "uids": []
                },
                "vector": {
                    "name": "gaul1",
                    "type": "database",
                    "options": {
                        "query_condition": {
                            "select": "adm1_code, adm1_name",
                            "from": "{{SCHEMA}}.gaul1_3857",
                            "where": "adm1_code IN ({{ADM1_CODE}}) GROUP BY adm1_code, adm1_name ORDER BY adm1_name"
                        },
                        "column_filter": "adm1_code",
                        "stats_columns": {
                            "polygon_id": "adm1_code",
                            "label_en": "adm1_name"
                        }
                    }
                },
                "stats": {
                    "raster_stats": {
                        "descriptive_stats": {
                            "force": true
                        }
                    }
                }
            }
        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            //require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                $('#' + CONFIG.placeholder).html(templates);

                // build_dropdowns
                build_dropdown_layers('ew_dropdown_layers')

                // build_dropdowns
                build_dropdown_gaul('ew_dropdown_gaul')

                // build map
                build_map('ew_map')

                $("#ew_button").bind( "click", function() {
                    // stats based on the selected layer and the selected country on the Dropdown
                    collector_to_build_stats()
                });

                //get_statistics(305, "Albania", "TRMM")
            //});
        }

        var build_dropdown_layers = function(id) {
            var url = FMCONFIG.METADATA_GET_LAYERS_BY_PRODUCT + "EARTHSTAT";
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    var dropdowndID = id + "_select";
                    var html = '<select id="'+ dropdowndID+'" style="width:100%;">';
                    html += '<option value=""></option>';
                    for(var i=0; i < response.length; i++) {
                        html += '<option value="' + response[i].uid + '">' + response[i].title[CONFIG.lang.toLocaleUpperCase()] + '</option>';
                    }
                    html += '</select>';

                    $('#' + id).empty();
                    $('#' + id).append(html);

                    try {
                        $('#' + dropdowndID).chosen({disable_search_threshold:6, width: '100%'});
                    }  catch (e) {}

                    $( "#" + dropdowndID ).change({},  function (event) {
                        if ( CONFIG.l ) {
                            CONFIG.m.removeLayer(CONFIG.l)
                        }
                        var layer = {};
                        layer.layers = $(this).val()
                        layer.layertitle = $("#" + dropdowndID + " :selected").text();
                        layer.urlWMS = CONFIG.url_geoserver_wms
                        layer.opacity='1';
                        layer.defaultgfi = true;
                        layer.openlegend= true;
                        CONFIG.l = new FM.layer(layer);
                        CONFIG.m.addLayer(CONFIG.l);

                    });
                },
                error : function(err, b, c) {}
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
                    var html = '<select multiple=""  id="'+ dropdowndID+'"  style="width:100%;">';
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

                    $( "#" + dropdowndID ).change({},  function (event) {
//                        collector_to_build_stats()
                    });
                },
                error : function(err, b, c) {}
            });
        }

        var build_map = function(id) {
            var options = {
                plugins: { geosearch : true, mouseposition: false, controlloading : true, zoomControl: 'bottomright'},
                guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
                gui: {disclaimerfao: true }
            }

            var mapOptions = { zoomControl:false,attributionControl: false };
            CONFIG.m = new FM.Map(id, options, mapOptions);
            CONFIG.m.createMap();

            var layer = {};
            layer.layers = "gaul1_3857"
            layer.layertitle = "Administrative unit1"
            layer.urlWMS = CONFIG.url_geoserver_wms
            layer.opacity='0.7';
            layer.zindex= 500;
            layer.style = 'gaul1_highlight_polygon';
            layer.cql_filter="adm1_code IN (0)";
            CONFIG.l_gaul1_highlight = new FM.layer(layer);
            CONFIG.m.addLayer(CONFIG.l_gaul1_highlight);

            var layer = {};
            layer.layers = "fenix:gaul0_line_3857"
            layer.layertitle = "Boundaries"
            layer.urlWMS = "http://fenixapps2.fao.org/geoserver-demo"
            layer.styles = "gaul0_line"
            layer.opacity='0.7';
            layer.hideLayerInControllerList = true;
            layer.zindex= 550;
            CONFIG.l_gaul0 = new FM.layer(layer);
            CONFIG.m.addLayer(CONFIG.l_gaul0);

            fmLayer.leafletLayer.redraw()
        }

        var collector_to_build_stats = function() {
            var gaul = $("#ew_dropdown_gaul_select").chosen().val();
            gaul = get_string_codes(gaul)
            var threshold_min = $("#ew_threshold_min").val();
            var threshold_max = $("#ew_threshold_max").val();
            // TODO: check threshold
            // TODO: function
            if ( CONFIG.l.layer.layers && gaul.length > 0) {
                build_stats(CONFIG.l.layer.layers, gaul, threshold_min, threshold_max, "ew_stats")
            }
        }

        var build_stats = function(uid, adm0_code, threshold_min, threshold_max, output_id) {
            loadingWindow.showPleaseWait()
            var json_stats = JSON.parse(JSON.stringify(CONFIG.json_stats));
            json_stats.raster.uid = uid
            json_stats.vector.options.query_condition.where = json_stats.vector.options.query_condition.where.replace("{{ADM0_CODE}}", adm0_code)
            var url = CONFIG.url_stats_raster
            $.ajax({
                type : 'POST',
                url : url,
                data: JSON.stringify(json_stats),
                contentType: 'application/json;charset=UTF-8',
                dataType: "json",
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    build_stats_response(response, threshold_min, threshold_max, output_id)
                },
                error : function(err, b, c) {
                    loadingWindow.hidePleaseWait()
                    console.log(err);
                }
            });
        }

        var build_stats_response = function (response, threshold_min, threshold_max, output_id) {
            var html = ""
            var codes = ""

            var ids = []
            // TODO: Sort by name
            var suddifx_id = "ew_gaul1_"
            html += "<div class='row'>" +
                "<div class='col-xs-8 col-sm-8 col-md-8 col-lg-8 text-primary'>" +
                    "<h4>Adm. Unit</h4>" +
                "</div>" +
                "<div class='col-xs-4 col-sm-4 col-md-4 col-lg-4' style='margin-left:-15px;'>" +
                    "<h4><small>Mean</small></h4>" +
                "</div>" +
                "</div>"
//            console.log(threshold_min);
//            console.log(threshold_max);
            for(var i=0; i < response.length; i++) {
                try {
                    var mean = response[i].data.stats[0].mean * 100
                    console.log(mean);
                    if ( mean >= threshold_min && mean <= threshold_max) {
                        mean = mean.toFixed(2);
                        var label = response[i].label
                        codes += response[i].code + ","
                        var id = suddifx_id + response[i].code;
                        html += "<div class='row'>" +
                                "<div style='cursor:pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' class='col-xs-8 col-sm-8 col-md-8 col-lg-8 text-primary'><h7><a id='" + id + "' data-toggle='tooltip' title='"+ label +"'>"+ label +"</a></h7></div>" +
                                "<div class='col-xs-4 col-sm-4 col-md-4 col-lg-4' style='margin-left:-15px;'><small>"+ mean +"%</small></div>" +
                                "</div>"

//                        html += "<h6><a style='cursor:pointer' class='text-primary' id='" + id + "'>" + label + "<small> " + mean + "%<small></a></h6>"
                        ids.push( { "code" : response[i].code, "label" : response[i].label })
                    }
                }
                catch(err) { }
            }
            $("#" + output_id +"_content").empty();
            $("#" + output_id + "_content").html(html);
            $("#" + output_id).show();


            // bind on hover and click
            for(var i=0; i < ids.length; i++) {
                $("#" + suddifx_id + ids[i].code).bind("click", { id: ids[i]}, function(event) {
                    zoom_to(event.data.id.code);
                    get_statistics(event.data.id.code, event.data.id.label, "TRMM")
                });
            }

            // highlight gaul1_layer
            console.log(CONFIG.l_gaul1_highlight)

            // remove last comma
            codes = codes.substring(0, codes.length - 1);
            console.log(codes)
            CONFIG.l_gaul1_highlight.layer.cql_filter="adm1_code IN ("+ codes +")";
            CONFIG.l_gaul1_highlight.redraw()
            loadingWindow.hidePleaseWait()

            if (codes.length <= 0 ) {
                $("#" + output_id + "_content").html("<h5 class='text-primary'>No statistics available</h5>");
            }
            else {
                // zoom to gaul1 codes
                zoom_to(codes)
            }
        }

        var zoom_to = function(codes) {
//            http://127.0.0.1:5005/spatialquery/db/spatial/SELECT%20ST_AsGeoJSON%28ST_Extent%28geom%29%29%20from%20spatial.gaul1_3857%20where%20adm1_code%20IN%20%2870073,70075,1503,1489,1506,1502,1485,1507,1498,1492,70072,1495,1501,1487,70074,1493,70080,1494,1509,1511,70081,70082,1505,1491,1504,1490,70079,1508,70077,70078,70076,1500%29
            // TODO: POST and not GET
            var query = "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), 4326)) FROM spatial.gaul1_3857 WHERE adm1_code IN ("+ codes +")"
            var url = CONFIG.url_spatialquery
            url += query;
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    var polygon = $.parseJSON(response[0][0])
                    var coordinates = polygon.coordinates;
                    var minlat = coordinates[0][0][1]
                    var minlon = coordinates[0][0][0]
                    var maxlat = coordinates[0][1][1]
                    var maxlon = coordinates[0][2][0]

                    // burundi
                    // 29.0249263852, -4.49998341229, 30.752262811, -2.34848683025
                    //  CONFIG.m.map.fitBounds([
                    //      [-4.49998341229, 29.0249263852],
                    //     [-2.34848683025, 30.752262811]
                    //  ]);

                    CONFIG.m.map.fitBounds([
                        [minlat, minlon],
                        [maxlat, maxlon]
                    ]);
                },
                error : function(err, b, c) {
                    alert(err)
                }
            });
        }

        var get_statistics = function(gaul_code, gaul_label, layer_code) {

            // adding title and rainfall data
            $("#ew_chart_panel").show()
            $("#ew_chart_title").html(gaul_label + " Rainfall timeserie")
            $("#ew_chart").empty()
            $("#ew_chart").append('<i class="text-primary fa fa-refresh fa-spin fa-2x"></i>')


            var url = CONFIG.url_search_layer_product_type
            url = url.replace("{{PRODUCT}}", layer_code)
            url = url.replace("{{TYPE}}", "none")
            console.log("URL: " + url);
            console.log("URL2: " + CONFIG.url_search_layer_product_type);
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response === 'string')? $.parseJSON(response): response;
                    console.log(response);
                    var uids = []
                    for(var i=0; i < response.length; i++) {
                        var layer = response[i]
                        uids.push(response[i].uid)
                    }
                    var json_stats_gaul1 = JSON.parse(JSON.stringify(CONFIG.json_stats_gaul1));
                    json_stats_gaul1.raster.uids = uids
                    json_stats_gaul1.raster.name = layer.title
                    json_stats_gaul1.vector.options.query_condition.where = json_stats_gaul1.vector.options.query_condition.where.replace("{{ADM1_CODE}}", gaul_code)
                    console.log(json_stats_gaul1);
                    var url = CONFIG.url_stats_rasters

                    var LAYERS = response;
                    $.ajax({
                        type : 'POST',
                        url : url,
                        data: JSON.stringify(json_stats_gaul1),
                        contentType: 'application/json;charset=UTF-8',
                        success : function(response) {
                            response = (typeof response == 'string')? $.parseJSON(response): response;
                            //build_stats_response(response, threshold, output_id)
                            console.log(response);
                            var STATS = response;

                            create_chart_stats(LAYERS, STATS)

                        },
                        error : function(err, b, c) {
                            console.log(err);
                        }
                    });
                },
                error : function(err, b, c) {
                    alert(err)
                }
            });
        }


        var create_chart_stats = function(layers, stats) {
            var series = []
            var mean = {}
            mean.name = "Mean"
            mean.data = []
            var sd = {}
            sd.name = "Standard_Deviation"
            sd.data = []
            var min = {}
            min.name = "Minimum"
            min.data = []
            var max = {}
            max.name = "Maximum"
            max.data = []

            var categories = []
            for (var i=0; i< layers.length; i++) {
                console.log(layers[i]);
                for (var j=0; j < stats.length; j++) {
                    if ( stats[j][layers[i].uid]) {
                        try {
                            console.log(stats[j][layers[i].uid]);
                            var data = stats[j][layers[i].uid][0];
                            console.log(data);
                            mean.data.push(data.data.stats[0].mean);
                            sd.data.push(data.data.stats[0].sd);
                            min.data.push(data.data.stats[0].min);
                            max.data.push(data.data.stats[0].max);
                            console.log(layers[i].meContent.seCoverage.coverageTime.from);
                            var date = timeConverter(layers[i].meContent.seCoverage.coverageTime.from, false)
                            console.log(date)
                            categories.push(date)
                            break;
                        }catch (e) {
                            console.log("Exception:" + e);
                        }
                    }

                }
            }
            if ( mean.data.length > 0 ) series.push(mean)
            if ( sd.data.length > 0 ) series.push(sd)
            if ( min.data.length > 0 ) series.push(min)
            if ( max.data.length > 0 )  series.push(max)

            var chart = {
                "categories" : categories,
                "series" : series
            }
            EW_CHART.createTimeserie(chart, "ew_chart", "line")
        }

        var timeConverter = function (UNIX_timestamp, addDay){
            var t = new Date(UNIX_timestamp*1000);
            var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            var year = t.getFullYear();
            var month = months[t.getMonth()];
            var date = t.getDate();
            //var hour = a.getHours();
//            var min = a.getMinutes();
//            var sec = a.getSeconds();
            if ( addDay )
                return date + '-' + month + '-' + year
            else
                return month + '/' + year
        }

        var get_string_codes = function(values) {
            var codes= ""
            for( var i=0; i < values.length; i++) {
                codes += "'"+ values[i] +"',"
            }
            return codes.substring(0, codes.length - 1);
        }

        // public instance methods
        return {
            build: build
        };
    };

});