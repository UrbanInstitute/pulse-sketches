var pymChild = null;
var pulseData;
var h = 300,
    w = 300;

var margin = {
    top: 10,
    right: 10,
    bottom: 25,
    left: 33
},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.5)
    .domain(["wk1_2","wk2_3","wk3_4"]);

var y = d3.scaleLinear()
    .domain([0,1])
    .rangeRound([height, 0]);

var PCTFORMAT = d3.format(".0%");

// Turn dropdown into jQuery UI selectmenu
$( function() {
    $( "#metrics" ).selectmenu({
        change: function( event, data ) {
            update();
        },
    });
});

$( function() {
    $( "#states" ).selectmenu({
        change: function( event, data ) {
            update();
        },
    });
});

$( function() {
    $( "#msas" ).selectmenu({
        change: function( event, data ) {
            update();
        },
    });
});

function drawGraphic(containerWidth) {

    setupChart("national");
    setupChart("asian");
    setupChart("black");
    setupChart("hispanic");
    setupChart("other");
    setupChart("white");

    if (pymChild) {
        pymChild.sendHeight();
    }
}

d3.csv("data/data.csv", function(d) {
    return {
        geography: d.geography,
        metric: d.metric,
        week_num: d.week_num,
        race_var: d.race_var,
        mean: +d.mean,
        se: +d.se,
        moe_95: +d.moe_95,
        moe_95_lb: +d.moe_95_lb,
        moe_95_ub: +d.moe_95_ub,
        geo_type: d.geo_type,
        sigdiff: +d.sigdiff,
    };
}, function(error, data) {

    pulseData = data;

    pymChild = new pym.Child({renderCallback: drawGraphic });

    // pymChild.onMessage("stateSelected", updateTray);

});

function setupChart(race) {
    var data;

    if(race === "national") {
        data = pulseData.filter(function(d) { return (d.geography === "US") &&
                                                        d.race_var === "total" &&
                                                        d.metric === "uninsured"; });
    }
    else {
        data = pulseData.filter(function(d) { return d.geography === "US" &&
                                                        (d.race_var === race || d.race_var === "total") &&
                                                        d.metric === "uninsured"; });
    }

    var svg = d3.select(".chart." + race + " svg")
        .attr("width", w)
        .attr("height", h);

    var g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // add axes
    g.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(PCTFORMAT).tickSize(-width));

    g.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0));


    // draw margin of error bands
    g.selectAll(".moe")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", function(d) {
            if((race === "national") && (d.geo_type === "national")) return "national moe";
            else {
                if(d.race_var === "total") return "statelocal moe";
                else return "race moe";
            }
        })
        .attr("x", function(d) { return x(d.week_num); })
        .attr("y", function(d) { return y(+d.moe_95_ub); })
        .attr("width", function(d) { return x.bandwidth(); })
        .attr("height", function(d) {
            return (d.moe_95_lb < 0) ? y(0) - y(d.moe_95_ub) : y(d.moe_95_lb) - y(d.moe_95_ub);
        })
        .classed("insig", function(d) { return (d.sigdiff === 0); });

    // draw point estimate dots on top of all of the margin of error bands
    g.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", function (d) {
            if((race === "national") && (d.geo_type === "national")) return "national dot";
            else {
                if(d.race_var === "total") return "statelocal dot";
                else return "race dot";
            }
        })
        .attr("cx", function(d) { return x(d.week_num) + x.bandwidth()*.5; })
        .attr("cy", function(d) { return y(+d.mean); })
        .attr("r", 4)
        .classed("insig", function(d) { return (d.sigdiff === 0); });
}

function update() {
    var metric = getMetric();

    // need to figure out which geography level is active
    var geo_level = getGeographyLevel();
    var geo;
    if(geo_level === "national") geo = "US";
    else if(geo_level === "state") geo = getGeography("state");
    else if(geo_level === "msa") geo = getGeography("msa");

    updateChart("national", metric, geo);
    updateChart("asian", metric, geo);
    updateChart("black", metric, geo);
    updateChart("hispanic", metric, geo);
    updateChart("other", metric, geo);
    updateChart("white", metric, geo);

    pymChild.sendHeight();
}

function updateChart(race, metric, geo) {
    var data;

    if(race === "national") {
        data = pulseData.filter(function(d) { return (d.geography === geo || d.geography === "US") &&
                                                        d.race_var === "total" &&
                                                        d.metric === metric; });
    }
    else {
        data = pulseData.filter(function(d) { return d.geography === geo &&
                                                        (d.race_var === race || d.race_var === "total") &&
                                                        d.metric === metric; });
    }
console.log(data);
    var svg = d3.select(".chart." + race + " svg");

    // update margin of error bands
    svg.selectAll(".moe")
        .data(data)
        .attr("class", function(d) {
            if((race === "national") && (d.geo_type === "national")) return "national moe";
            else {
                if(d.race_var === "total") return "statelocal moe";
                else return "race moe";
            }
        })
        .attr("x", function(d) { return x(d.week_num); })
        .attr("y", function(d) { return y(+d.moe_95_ub); })
        .attr("width", function(d) { return x.bandwidth(); })
        .attr("height", function(d) {
            return (d.moe_95_lb < 0) ? y(0) - y(d.moe_95_ub) : y(d.moe_95_lb) - y(d.moe_95_ub);
        })
        .classed("insig", function(d) { return (d.sigdiff === 0); });

    // update point estimate dots
    svg.selectAll(".dot")
        .data(data)
        .attr("class", function (d) {
            if((race === "national") && (d.geo_type === "national")) return "national dot";
            else {
                if(d.race_var === "total") return "statelocal dot";
                else return "race dot";
            }
        })
        .attr("cx", function(d) { return x(d.week_num) + x.bandwidth()*.5; })
        .attr("cy", function(d) { return y(+d.mean); })
        .classed("insig", function(d) { return (d.sigdiff === 0); });
}

function getMetric() {
    // var dropdown = document.getElementById('metrics');
    // var selected_metric = dropdown.options[dropdown.selectedIndex].value;

    return d3.select("#metrics").property("value");
    // return selected_metric;
}

function getGeographyLevel() {
    var geo_level = d3.selectAll("input[name='geo']:checked").property("value");

    // make sure appropriate dropdown menus are or aren't disabled based on selection
    if(geo_level === "national") {
        d3.select(".states.dropdown_container").classed("disabled", true);
        d3.select(".msas.dropdown_container").classed("disabled", true);
    }
    else if(geo_level === "state") {
        d3.select(".states.dropdown_container").classed("disabled", false);
        d3.select(".msas.dropdown_container").classed("disabled", true);
    }
    else if(geo_level === "msa") {
        d3.select(".states.dropdown_container").classed("disabled", true);
        d3.select(".msas.dropdown_container").classed("disabled", false);
    }

    return geo_level;
}

function getGeography(geo_level) {
    var dropdown = document.getElementById(geo_level + 's');
    var selected_geo = dropdown.options[dropdown.selectedIndex].value;
    return selected_geo;
}

d3.selectAll("input[name='geo']").on("change", function() { update(); });

d3.select("#states").on("change", function() {
    // var m = this.value.replace(/\W/g,'_');
    update();
})

d3.select("#msas").on("change", function() { update(); });