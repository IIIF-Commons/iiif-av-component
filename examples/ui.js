/********************************
* User Interface Methods
********************************/

function initUI() {

	$('#manifestInput').val('');

	$('#clearLogsButton').click(clearLogs);

	$('#toggleLogsButton').click(function() {
		$('.logContainer').toggle();
	});

	$('.testFixture').click(function() {
		$('#manifestInput').val( $(this).data('json') );
		$('#parseManifestButton').click();
	});

	$('#viewManifestButton').click(function() {
		var absoluteManifestURL = $('#manifestInput').val();
		window.open(absoluteManifestURL, '_blank', 'location=yes,height=600,width=580,scrollbars=yes,status=yes');
	});
	
	$('#parseManifestButton').click(function() {

		var manifestURL = $('#manifestInput').val();

        loadManifest(manifestURL, function(helper) {

            clearLogs();

            $('.title').text(helper.getLabel());
            $('.description').text(helper.getDescription());

            logMessage('SUCCESS: Manifest data loaded.', helper.manifest);

            var canvases = helper.getCanvases();

			for (var i = 0; i < canvases.length; i++) {
				initCanvas(canvases[i]);
			}

			if (canvases.length > 1) {
				initCanvasNavigation(canvases);
			}

			if (data.structures) {
				initRangeNavigation(data.structures);
			}
            
        }, function(error) {

            $('.title').text('ERROR: Could not load manifest data.');
            $('.description').text('');
            
			logMessage('ERROR: Could not load manifest data.', error);

        });

	});

}

function initCanvasNavigation(canvases) {

	for (var i=0; i<canvases.length; i++) {
		
		var canvasLabel = i+1;
		var canvasNavigationButton = $('<button class="canvasNavigationButton" data-canvas-id="'+ canvases[i].id +'">Canvas '+ canvasLabel +'</button>');
		
		canvasNavigationButton.click(function() {
			navigateToCanvas( $(this).attr('data-canvas-id') );
		});

		$('.canvasNavigationContainer').append(canvasNavigationButton);

	}

	window.setTimeout(function() {
		var firstID = canvasInstances[0].data.id;
		navigateToCanvas(firstID);
	}, 10);
	
}

function initRangeNavigation(structures) {
	
	var rangeNavigationContainer = $('<ul class="rangeNavigationContainer"></ul>');
	
	for (var s=0; s<structures.length; s++) {
		var structureSelector = $('<li data-range="'+ structures[s].id +'">'+ structures[s].label +'</li>');
			structureSelector.click(function() {
				logMessage('SELECT RANGE: '+ $(this).attr('data-range'));
			});

		var ranges = structures[s].members,
			rangeContainer = $('<ul></ul>');

		if (ranges) {
			for (var i=0; i<ranges.length; i++) {
				var rangeSelector = $('<li data-range="'+ ranges[i].id +'">'+ ranges[i].label +'</li>');
					rangeSelector.click(function() {
						logMessage('SELECT RANGE: '+ $(this).attr('data-range'));
					});
					rangeContainer.append(rangeSelector);

				var subranges = ranges[i].members,
					subrangeContainer = $('<ul></ul>');

				if (subranges) {
					for (var r=0; r<subranges.length; r++) {
						var subrangeSelector = $('<li data-range="'+ subranges[r].members[0].id +'">'+ subranges[r].label +'</li>');
						subrangeSelector.click(function() {
							var thisRange = $(this).attr('data-range'),
								selectedCanvas = getCanvasInstanceByID( thisRange );

							if (selectedCanvas) {
								navigateToCanvas(selectedCanvas.data.id);

								var temporal = /t=([^&]+)/g.exec(thisRange);
								if(temporal && temporal[1]) {
									var rangeTiming = temporal[1].split(',');
									selectedCanvas.setCurrentTime(rangeTiming[0]);
									//selectedCanvas.playCanvas();
								}
								logMessage('SELECT RANGE: '+ thisRange);
							} else {
								logMessage('ERROR: Could not find canvas for range '+ thisRange);
							}
							
							//alert('Range: '+ $(this).attr('data-range'));

						});
						subrangeContainer.append(subrangeSelector);
					}
					subrangeContainer.appendTo(rangeContainer);
				}

			}
		}

		
		rangeNavigationContainer.append(structureSelector);
		rangeNavigationContainer.append(rangeContainer);
	}

	

	$('.playerContainer').append(rangeNavigationContainer);
}

function navigateToCanvas(canvasID) {
	for (var i=0; i<canvasInstances.length; i++) {
		canvasInstances[i].pauseCanvas();
	}
	$('.playerContainer .player').hide();
	getCanvasInstanceByID(canvasID).playerElement.show();
}

/*
function stackItems(containerElement) {
	containerElement.CollisionDetection({spacing: 1, includeVerticalMargins: true})
}
*/

function showWorkingIndicator(targetElement) {
	var workingIndicator = $('<div class="workingIndicator">Waiting ...</div>');
	if (targetElement.find('.workingIndicator').length == 0) {
		targetElement.append(workingIndicator);
	}
	//console.log('show working');
}

function hideWorkingIndicator() {
	$('.workingIndicator').remove();
	//console.log('hide working');
}

function getCanvasInstanceByID(canvasID) {
	cleanCanvasID = canvasID.replace('http://', '').replace('https://', '').split('#')[0];
	for (var i=0; i<canvasInstances.length; i++) {
		var cleanInstanceID = canvasInstances[i].data.id.replace('http://', '').replace('https://', '').split('#')[0];
		if (cleanInstanceID == cleanCanvasID) {
			return canvasInstances[i];
		}
	}

	return null;
	
}

function logMessage(message, logObj) {
	if (logObj) {
		//console.log(message, logObj);
	} else {
		//console.log(message);
	}

	$('.logContainer textarea')[0].value = $('.logContainer textarea')[0].value += '\n'+ message;
}

function clearLogs() {
	$('.logContainer textarea')[0].value = '';
}

