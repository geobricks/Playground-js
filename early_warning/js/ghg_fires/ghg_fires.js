define(['jquery',
    'mustache',
    'text!../../html/ghg_fires/template.html',
    'loglevel',
    'fenix-map',
    'fenix-map',
    'highcharts',
    'highcharts-heatmap',
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
                    var codes = ""
                    for (var i=0; i < response.length; i++) {
                        codes +=response[i][0]
                        if ( i < response.length -1)
                            codes += ","
                    }

                    var id = randomID();
                    var html = "<div class='row'>" +
                        "<h5 class='col-xs-12 text-primary'>Burned Areas in '000 Km^2</h5>" +
                        "</div>"
                    html += "<div class='row'>"
                    html += "<div id='" + id + "'><i class='fa fa-refresh fa-spin fa-5x'></i></div>"
                    html += "</div>"
                    $("#ghg_fires_charts_container").append(html);
                    create_chart(id, codes, "Chart", response)


//                    for (var i=0; i < response.length; i++) {
//                        var id = randomID();
//
//                        // chart html template
//                        var html = "<div class='row'>" +
//                            "<h5 class='col-xs-12 text-primary'>"+ response[i][1] +"</h5>" +
//                            "</div>"
//                        html += "<div class='row'>"
//                        html += "<div id='" + id + "'><i class='fa fa-refresh fa-spin fa-5x'></i></div>"
//                        html += "</div>"
//                        $("#ghg_fires_charts_container").append(html);
//                        create_chart(id, response[i][0], response[i][1])
//                    }
                },
                error : function(err, b, c) {}
            });

        }


        var create_chart = function(chart_id, codes, label, values) {
            console.log("---CReate chart--");
            console.log(codes);
            console.log(label);
            var url = "http://168.202.28.214:5005/ghg/rasters/burned_areas/fenix:burned_areas_182_2014/land_cover/fenix:land_cover_maryland_2009/gaul/1/codes/" +codes
            var _values = values
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    // format data
                    var data = []
                    var yAxis_categories = []
                    var find = ' ';
                    var re = new RegExp(find, 'g');

                    var create_chart = false

                    //var pixel_constant = 250000
                    var pixel_constant_truked = 250
                    for (var i=0; i < response.length; i++) {
                        _values[i][1] = _values[i][1].replace(re, '')
                        yAxis_categories.push(_values[i][1]);
                        for(var j=0; j < response[i][0].values.length; j++) {
                           var d = [j, i, response[i][0].values[j] * pixel_constant_truked]

                           data.push(d)

                           // check if at least a value is  > 0
                           if (response[i][0].values[j] > 0) {
                                create_chart = true
                           }
                        }
                    }

                    var xAxis_categories = [
                        "evergreen_needleleaf_forest",
                        "evergreen_broadleaf_forest",
                        "deciduous_needleleaf_forest",
                        "deciduous_broadleaf_forest",
                        "mixed_forests",
                        "closed_shrubland",
                        "open_shrublands",
                        "woody_savannas",
                        "savannas",
                        "grasslands",
                        "permanent_wetlands",
                        "croplands",
                        "urban_and_built-up",
                        "cropland/natural_vegetation_mosaic",
                        "snow_and_ice",
                        "barren_or_sparsely_vegetated"
                    ]

                    var chart = {
                        xAxis: {
                            categories: xAxis_categories,
                            labels: {
                                rotation: -45,
                                style: {
                                    fontSize: '9px',
                                    fontFamily: 'Verdana, sans-serif'
                                }
                            }
                        },
                        yAxis: {
                            title : "Provinces",
                            categories: yAxis_categories,
                            labels: {
                                style: {
                                    fontSize: '9px',
                                    fontFamily: 'Verdana, sans-serif'
                                }
                            }
                        },
                        tooltip: {
                            formatter: function () {
                                return '<b>' + this.series.yAxis.categories[this.point.y] + '</b> <br><b>' +
                                    this.point.value + '</b> km^2 burned <br><b>' + this.series.xAxis.categories[this.point.x] + '</b>';
                            }
                        },
                        series: [
                            {
                                name: "Burned area '000 km^2",
                                borderWidth: 0.1,
                                borderColor: "#000",
                                data: data,
                                dataLabels: {
                                    enabled: true,
                                    align: 'center',
                                    color: 'black',
                                    verticalAlign: 'middle',
                                    style: {
                                        textShadow: 'none',
                                        HcTextStroke: null
                                    }
                                }
                            }
                        ]
                    }

                    console.log(chart)

                    if ( create_chart ) {
                        var height = parseFloat(xAxis_categories.length * 45)
                        $("#" + chart_id).css("height", "1500px")
                        EW_CHART.createHeatmap(chart, chart_id, "heatmap")
                    }
                    else {
                        $("#" + chart_id).html("<h6 class='col-xs-12 text-warning'>No burned areas found </h6>")
                    }

                    //create_charts(chart, chart_id)

//                    var series = []
//                    var series_values = []
//                    var pixel_constant = 250000
//                    // check if there is at least one value
//                    var check_serie = false;
//                    for (var i=0; i < response[0].values.length; i++) {
//                        if ( response[0].values[i] != "") {
//                            check_serie = true;
//                            break;
//                        }
//                    }
//
//                    if( check_serie ) {
//                        for (var i=0; i < response[0].values.length; i++) {
//                            series_values.push(response[0].values[i]*pixel_constant)
//                        }
//
//                        series.push({"name": "Land Type", "data": series_values })
//                        var chart = {
//                            "categories": categories,
//                            "series": series,
//                            "yAxis" : {
//                                "title" : {
//                                    "text" : "km^2"
//                                }
//                            }
//                        }
//                        console.log(chart);
//                        $("#" + chart_id).css("height", "450px")
//                        $("#" + chart_id).css("width", "350px")
//                        //EW_CHART.createTimeserie(chart, chart_id, "column")
//                        create_charts(chart, chart_id)
//                    }
//                    else {
//                        $("#" + chart_id).html("<h6 class='col-xs-12 text-warning'>No burned areas found </h6>")
//                    }
                },
                error : function(err, b, c) {}
            });
        }

        var create_charts = function(chart, chart_id) {

            var chart = {

                series: [
                    {
                        name: 'Sales per employee',
                        borderWidth: 1,
                        data: [
                            [0, 0, 10],
                            [0, 1, 19],
                            [0, 2, 8],
                            [0, 3, 24],
                            [0, 4, 67],
                            [1, 0, 92],
                            [1, 1, 58],
                            [1, 2, 78],
                            [1, 3, 117],
                            [1, 4, 48],
                            [2, 0, 35],
                            [2, 1, 15],
                            [2, 2, 123],
                            [2, 3, 64],
                            [2, 4, 52],
                            [3, 0, 72],
                            [3, 1, 132],
                            [3, 2, 114],
                            [3, 3, 19],
                            [3, 4, 16],
                            [4, 0, 38],
                            [4, 1, 5],
                            [4, 2, 8],
                            [4, 3, 117],
                            [4, 4, 115],
                            [5, 0, 88],
                            [5, 1, 32],
                            [5, 2, 12],
                            [5, 3, 6],
                            [5, 4, 120],
                            [6, 0, 13],
                            [6, 1, 44],
                            [6, 2, 88],
                            [6, 3, 98],
                            [6, 4, 96],
                            [7, 0, 31],
                            [7, 1, 1],
                            [7, 2, 82],
                            [7, 3, 32],
                            [7, 4, 30],
                            [8, 0, 85],
                            [8, 1, 97],
                            [8, 2, 123],
                            [8, 3, 64],
                            [8, 4, 84],
                            [9, 0, 47],
                            [9, 1, 114],
                            [9, 2, 31],
                            [9, 3, 48],
                            [9, 4, 91]
                        ]
                    }
                ]
            }

            $("#" + chart_id).css("height", "450px")
            EW_CHART.createHeatmap(chart, chart_id, "heatmap")
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