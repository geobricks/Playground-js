define(['jquery',
    'mustache',
    'text!../../html/early_warning/early_warning.html',
    'loglevel',
    'fenix-map',
    'fenix-map',
    'bootstrap'], function ($, Mustache, templates, log) {

    var global = this;
    global.Early_warning = function() {

        var loadingWindow;
        loadingWindow = loadingWindow || (function () {
            var pleaseWaitDiv = $('<div class="modal hide" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-header"><h1>Processing...</h1></div><div class="modal-body"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div></div>');
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

            url_geoserver_wms: 'http://localhost:9090/geoserver/wms',

            url_spatialquery: "http://127.0.0.1:5005/spatialquery/db/spatial/",

            url_stats_raster: "http://localhost:5005/stats/raster/spatial_query",

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
                            "from": "{{SCHEMA}}.gaul1_3857_test",
                            "where": "adm0_code IN ('{{ADM0_CODE}}') GROUP BY adm1_code, adm1_name "
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
            }
        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                $('#' + CONFIG.placeholder).html(templates);

                // build_dropdowns
                build_dropdown_layers('ew_dropdown_layers')

                // build_dropdowns
                build_dropdown_gaul('ew_drowdown_gaul')

                // build map
                build_map('ew_map')

                $("#ew_button").bind( "click", function() {
                    // stats based on the selected layer and the selected country on the Dropdown
                    var gaul = $("#ew_drowdown_gaul_select").chosen().val();
                    var threshold = $("#ew_threshold").val();
                    build_stats(CONFIG.l.layer.layers, gaul, threshold, "ew_stats")
                });
            });
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
                        layer.layertitle = $(this).val()
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
            var query = "SELECT adm0_code, adm0_name FROM spatial.gaul0_3857_test WHERE disp_area = 'NO' ORDER BY adm0_name"
            var url = CONFIG.url_spatialquery + query
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    console.log(response);
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
            layer.layers = "gaul1_3857_test"
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
            layer.urlWMS = "http://fenix.fao.org/geo"
            layer.styles = "gaul0_line"
            layer.opacity='0.7';
            layer.zindex= 550;
            CONFIG.l_gaul0 = new FM.layer(layer);
            CONFIG.m.addLayer(CONFIG.l_gaul0);
        }

        var build_stats = function(uid, adm0_code, threshold, output_id) {
            loadingWindow.showPleaseWait()
            var json_stats = JSON.parse(JSON.stringify(CONFIG.json_stats));
            json_stats.raster.uid = uid
            json_stats.vector.options.query_condition.where = json_stats.vector.options.query_condition.where.replace("{{ADM0_CODE}}", adm0_code)
            console.log(json_stats);
            var url = CONFIG.url_stats_raster
            $.ajax({
                type : 'POST',
                url : url,
                data: JSON.stringify(json_stats),
                contentType: 'application/json;charset=UTF-8',
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    build_stats_response(response, threshold, output_id)
                },
                error : function(err, b, c) {
                    loading.hidePleaseWait()
                    console.log(err);
                }
            });
        }

        var build_stats_response = function (response, threshold, output_id) {
            log.info(response)
            var html = ""
            var codes = ""


//            var values = []
//            for(var i=0; i < response.length; i++) {
//                var mean = response[i].data.stats[0].mean * 100
//                if ( mean >= threshold) {
//                    var label = response[i].label;
//                    var obj = {}
//                    obj[label] = response[i]
//                    values.push(obj)
//                }
//            }
//            console.log(values.sort());


            var ids = []
            // TODO: Sort by name
            var suddifx_id = "ew_gaul1_"
            html += "<div class='row'>" +
                "<div class='col-xs-8 col-sm-8 col-md-8 col-lg-8 text-primary' id='" + id + "'><h4>Adm. Unit<h4></div>" +
                "<div class='col-xs-4 col-sm-4 col-md-4 col-lg-4'><small>Mean</small></div>" +
                "</div>"
            for(var i=0; i < response.length; i++) {
                try {
                    var mean = response[i].data.stats[0].mean * 100
                    if ( mean >= threshold) {
                        mean = mean.toFixed(2);
                        var label = response[i].label
                        codes += response[i].code + ","
                        var id = suddifx_id + response[i].code;
                        html += "<div class='row'>" +
                                "<div style='cursor:pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' class='col-xs-8 col-sm-8 col-md-8 col-lg-8 text-primary' id='" + id + "'><h7><a>"+ label +"</a></h7></div>" +
                                "<div class='col-xs-4 col-sm-4 col-md-4 col-lg-4'><small>"+ mean +"%</small></div>" +
                                "</div>"

//                        html += "<h6><a style='cursor:pointer' class='text-primary' id='" + id + "'>" + label + "<small> " + mean + "%<small></a></h6>"
                        ids.push(response[i].code)
                    }
                }
                catch(err) { }
            }
            $("#" + output_id +"_content").empty();
            $("#" + output_id + "_content").html(html);
            $("#" + output_id).show();

            // bind on hover and click
            for(var i=0; i < ids.length; i++) {
                $("#" + suddifx_id + ids[i]).bind("click", { id: ids[i]}, function(event) {
                    zoom_to(event.data.id);
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
//            http://127.0.0.1:5005/spatialquery/db/spatial/SELECT%20ST_AsGeoJSON%28ST_Extent%28geom%29%29%20from%20spatial.gaul1_3857_test%20where%20adm1_code%20IN%20%2870073,70075,1503,1489,1506,1502,1485,1507,1498,1492,70072,1495,1501,1487,70074,1493,70080,1494,1509,1511,70081,70082,1505,1491,1504,1490,70079,1508,70077,70078,70076,1500%29
            // TODO: POST and not GET
            var query = "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), 4326)) FROM spatial.gaul1_3857_test WHERE adm1_code IN ("+ codes +")"
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


        // public instance methods
        return {
            build: build
        };
    };

});