var pymChild = null;
var pulseData;
var h = 300,
    w = 300;

var margin = {
    top: 10,
    right: 10,
    bottom: 25,
    left: 25
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
        data = pulseData.filter(function(d) { return (d.geography === "MD" || d.geography === "US") &&
                                                        d.race_var === "total" &&
                                                        d.metric === "uninsured"; });
    }
    else {
        data = pulseData.filter(function(d) { return d.geography === "MD" &&
                                                        (d.race_var === race || d.race_var === "total") &&
                                                        d.metric === "uninsured"; });
    }

    var svg = d3.select(".chart." + race + " svg")
        .attr("width", w)
        .attr("height", h);

    var g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .call(d3.axisLeft(y));

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

d3.select("#metrics").on("change", function(){
    var m = this.value
    if(m == "all"){
        d3.selectAll(".metric").classed("hide", false)
    }else{
        d3.selectAll(".metric").classed("hide", true)
        d3.selectAll(".metric." + m).classed("hide", false)
    }
})

d3.select("#geographies").on("change", function(){
    var m = this.value.replace(/\W/g,'_')
    if(m == "all"){
        d3.selectAll(".city").classed("hide", false)
    }else{
        d3.selectAll(".city").classed("hide", true)
        d3.selectAll(".city." + m).classed("hide", false)
    }
})