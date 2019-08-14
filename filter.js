    //=============================
    // Floor Plans Page
    //=============================

    /* Create Isotope Filter 
        * @param    sort         The term to filter by 
        * @param    desc         The order in which to search by     
        */
    function runIsotope(sort, order) {
        // Destroy results if function is ran again
        $('#results').isotope('destroy');

        // Define filter function settings
        $('#results').isotope({
            layoutMode: 'vertical',
            sortBy: sort,
            sortAscending: order,            
            getSortData: {
                unit: '.unit',
                price: '[data-price]',
                bed: '[data-size]',
                bath: '.bath',
                size: '[data-size]',
            }
        });
    }

    // Trigger the filter function 
    $('.sortBy').on('click', 'a', function (e) {
        e.preventDefault();
        let orderBy = $(this).data('orderby');
        let sortcommand = $(this).data('sort');
        let desc;

        // Determine the direction of the filter if filter is clicked again.
        if (orderBy == 'desc') {
            $(this).data('orderby', 'asc');
            desc = false;
        } else {
            $(this).data('orderby', 'desc');
            desc = true;
        }

        // Run isotope filter
        runIsotope(sortcommand, desc);
    });


    /* Creates the results for both the map and list view
    *   @param info             JSON object with results 
    *   @param initialLoad      Boolean value determining whether function should run as initial 
    */
    function create_results(info, initialLoad) {

        // Clear older results and loading screen 
        jQuery('#results').html('');
        jQuery('.results-map').removeClass('loading');

        // Destroy any existing tooltips on svg map
        if (jQuery('.tooltip').hasClass('activeUnit')) {
            jQuery('.activeUnit').tooltipster('destroy');
        }

        // Set the results counter in filter based on new results
        var resultsLength = Object.keys(info).length + ' Results';
        jQuery('#resultsCount').html(resultsLength);

        // Clear the data attributes from existing units on svg map
        jQuery('.activeUnit').attr('data-beds', null)
            .attr('data-bath', null)
            .attr('data-sqft', null)
            .attr('data-floor', null)
            .attr('data-price_formatted', null)
            .attr('data-foorplan_name', null)
            .attr('data-availability', null)
            .attr('data-image', null)
            .removeClass('activeUnit');

        // Run handle bar template for each result in @info object to build list view 
        jQuery.each(info, function (i, val) {
            let source = document.getElementById("mobile-listing").innerHTML;
            let template = Handlebars.compile(source);
            let context = val;
            let html = template(context);
            jQuery('#results').append(html);

            // Set data on svg map for new query, unless it's the first time running
            if (initialLoad == false) {
                let selectedUnit = $('svg [data-unit-' + context.floor + '=' + context.unit + ']')
                    .attr('data-beds', context.bed)
                    .attr('data-bath', context.bath)
                    .attr('data-sqft', context.sqft)
                    .attr('image', context.floor_plan_images)
                    .attr('data-floor', context.floor)
                    .attr('data-floorplan_name', context.foorplan_name)
                    .attr('data-price_formatted', context.price_formatted)
                    .attr('data-availability', context.availability)
                    .attr('data-unit', context.unit)
                    .addClass('activeUnit');
            }
        });

        // Construct tooltips on svg based on data attributes after new query is set
        jQuery('.activeUnit').tooltipster({
            contentAsHTML: true,
            interactive: true,
            onlyOne: true,
            position: 'right',
            arrow: false,
            viewportAware: true,
            functionInit: function (instance, helper) {
                // parse the content
                let data = helper.origin.attributes;
                console.log(data['data-availability'].nodeValue);
                //console.log(data.beds);
                let tooltipContent = '<div class="bedIdentifier bedroom' + data['data-beds'].nodeValue + '">';
                tooltipContent += '<h3>' + data['data-unit'].nodeValue + '</h3>';
                tooltipContent += '<div class="unit-info-item">Type: ' + data['data-floorplan_name'].nodeValue + '</div>';
                tooltipContent += '<div class="unit-info-item">' + data['data-beds'].nodeValue + ' Bed / ' + data['data-bath'].nodeValue + ' Bath</div>';
                tooltipContent += '<div class="unit-info-item">' + data['data-sqft'].nodeValue + ' SF</div>';
                tooltipContent += '<div class="unit-info-item">Floor: ' + data['data-floor'].nodeValue + '</div>';
                tooltipContent += '<div class="unit-info-item">From: ' + data['data-price_formatted'].nodeValue + '</div>';
                tooltipContent += '<div class="unit-info-item">Available: ' + data['data-availability'].nodeValue + '</div>';
                tooltipContent += '</div>';
                // save the edited content
                instance.content(tooltipContent);
            }
        });

        // Run the isotope filter to prevent absolute page break
        runIsotope();
    }

    /*  Get results from api source
    *   @param initialLoad      determines if it's the first time loading 
    */
    function get_results(initialLoad) {
        let form = jQuery('#resultsForm');
        let url = form.attr('action');
        jQuery.ajax({
            type: "POST",
            url: url,
            async: true,
            data: form.serialize(), 
            beforeSend: function (xhr) {
                // Create loading effects 
                jQuery('.results-map').addClass('loading');
                jQuery("#results").html('<div class="loadingResults"><img src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/ab79a231234507.564a1d23814ef.gif" style="max-width:100px; display:table; margin:30 auto;" /></div>');
            },
            success: function (data) {
                let json = JSON.parse(data);
                create_results(json, initialLoad);
            }
        });
    }

    // Gets ajax results with form is submitted
    jQuery("#resultsForm").submit(function (e) {
        e.preventDefault();
        if (jQuery('.toggle.map').hasClass('active')) {
            if (jQuery('#floor-field').val()) {
                // Remove error if floor exists and submit
                jQuery('.results-map .error').remove();
                get_results(false);
            } else {
                // Avoid sumbmission of form if no floor selected
                jQuery('.results-map').prepend('<div class="error">Please select a floor to view results on map</div>');
            }
        } else { // If list view submit
            get_results(false);
        }
    });

    // Gets Results on initial page load from api
    jQuery(document).ready(function () {
        get_results(true);
    });
