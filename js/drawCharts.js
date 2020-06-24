var pymChild = null;
var pulseData;
var h = 300,
    w = 450;

var margin = {
    top: 10,
    right: 10,
    bottom: 35,
    left: 33
},
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

var x = d3.scaleBand()
    .rangeRound([0, width])
    .padding(0.2)
    .domain(["wk1_2","wk2_3","wk3_4","wk4_5","wk5_6"]);

var y = d3.scaleLinear()
    .domain([0,1])
    .rangeRound([height, 0]);

var PCTFORMAT = d3.format(".0%");

// dummy data so that elements are entered on the National graph on load
// as placeholders for the state/MSA-specific points
// the chart initializes with US as the selected geo so only
// 3 points will be drawn on the first small multiple chart if we don't
// add placeholders for future state or MSA-level data
var dummy_state_data = [
    {
        geo_type: "state",
        geography: "dummy data",
        mean: -1,
        metric: "uninsured",
        moe_95: 0,
        moe_95_lb: 0,
        moe_95_ub: 0,
        race_var: "total",
        se: 0,
        sigdiff: 0,
        week_num: "wk1_2",
    },
    {
        geo_type: "state",
        geography: "dummy data",
        mean: -1,
        metric: "uninsured",
        moe_95: 0,
        moe_95_lb: 0,
        moe_95_ub: 0,
        race_var: "total",
        se: 0,
        sigdiff: 0,
        week_num: "wk2_3",
    },
        {
        geo_type: "state",
        geography: "dummy data",
        mean: -1,
        metric: "uninsured",
        moe_95: 0,
        moe_95_lb: 0,
        moe_95_ub: 0,
        race_var: "total",
        se: 0,
        sigdiff: 0,
        week_num: "wk3_4",
    }
];


// Turn dropdowns into jQuery UI selectmenu
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

d3.csv("data/rolling_all_to_current_week.csv", function(d) {
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
                                                        d.metric === "uninsured"; })
                        .concat(dummy_state_data);
    }
    else {
        data = pulseData.filter(function(d) { return d.geography === "US" &&
                                                        (d.race_var === race || d.race_var === "total") &&
                                                        d.metric === "uninsured"; });
    }

    // insert chart title
    d3.select(".chart_title").text(chartTitles["uninsured"]);

    // insert trend description
    d3.select(".trend_description").html(trendDescriptions["uninsured"]);

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
        .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(function(d, i) { return "Week " + (i+1) + " and " + (i+2) + " Avg."; }))
        .selectAll(".tick text")
        .call(wrap, x.bandwidth());

// "Week 1 and 2 Avg.","Week 2 and 3 Avg.","Week 3 and 4 Avg."
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
        if(geo === "US") {
            data = data.concat(dummy_state_data);
        }
    }
    else {
        data = pulseData.filter(function(d) { return d.geography === geo &&
                                                        (d.race_var === race || d.race_var === "total") &&
                                                        d.metric === metric; });
    }
console.log(data);

    // update chart title
    d3.select(".chart_title").text(chartTitles[metric]);

    // insert trend description
    d3.select(".trend_description").html(trendDescriptions[metric]);

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

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
    while (word = words.pop()) {
      line.push(word)
      tspan.text(line.join(" "))
      if (tspan.node().getComputedTextLength() > width) {
        line.pop()
        tspan.text(line.join(" "))
        line = [word]
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
      }
    }
  })
}