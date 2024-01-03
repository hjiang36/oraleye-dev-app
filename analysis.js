// Allow drawing rectangles on the canvas
let isDrawing = false;
let origX = 0;
let origY = 0;
let rect = null;
let canvas = null;
const fillColorAlpha = 0.4;
const strokeColorAlpha = 0.8;

// State variables for the mouse hover
let isHovering = false;
let hoverTimeout;

function updateIconPosition(rect) {
    const iconButton = document.getElementById('annotationIcons');
    const rectCenter = rect.getCenterPoint();

    // Position the icon at the center of the rectangle
    iconButton.style.display = 'block';
    iconButton.style.top = `${rectCenter.y - rect.height / 2 - iconButton.clientHeight}px`;
    iconButton.style.left = `${rectCenter.x + rect.width / 2 - iconButton.clientWidth}px`;
}

function updateColorPicker(e) {
    const activeObject = e.selected[0];

    if (activeObject && activeObject.type === 'rect') {
        // Assuming you have two color picker inputs for stroke and fill
        const strokeColorPicker = document.getElementById('borderColorPicker');
        const fillColorPicker = document.getElementById('fillColorPicker');

        // Update the color picker values
        if (strokeColorPicker && activeObject.stroke) {
            // Only update rgb values, strip alpha channel
            strokeColorPicker.value = activeObject.stroke.slice(0, -2);
        }
        if (fillColorPicker && activeObject.hoverFillColor) {
            fillColorPicker.value = activeObject.hoverFillColor.slice(0, -2);
        }
    }
}

function updateAnnotationInput(e) {
    const annotationInput = document.getElementById('regionAnnotation');
    const activeObject = e.selected[0];
    if (activeObject && activeObject.type === 'rect') {
        annotationInput.value = activeObject.annotation || '';
    }
}

function updateInfoSidebar(e) {
    updateAnnotationInput(e);
    updateColorPicker(e);
}

document.addEventListener('DOMContentLoaded', function () {
    canvas = new fabric.Canvas('annotationCanvas');

    // Load annotation data from JSON string
    window.electronAPI.loadFile("test/analysis.json").then((json) => {
        if (json) {
            // convert json byte array to string
            const jsonString = new TextDecoder("utf-8").decode(json);
            console.log(jsonString);
            canvas.loadFromJSON(jsonString, function () {
                canvas.renderAll();
            });
        }
    });

    // Adjust the style of the Fabric.js container
    const canvasContainer = canvas.lowerCanvasEl.parentNode;
    canvasContainer.style.position = 'absolute';
    canvasContainer.style.top = '0';
    canvasContainer.style.left = '0';

    const imgEl = document.getElementById('analysisImageView');
    canvas.setDimensions({ width: imgEl.width, height: imgEl.height });
    imgEl.onload = function () {
        canvas.setDimensions({ width: imgEl.width, height: imgEl.height });
    };

    window.addEventListener('resize', function () {
        // Adjust canvas size to match the new image size
        canvas.setDimensions({ width: imgEl.width, height: imgEl.height });
    });

    canvas.on('mouse:down', function (o) {
        if (o.target) {
            return;
        }

        isDrawing = true;
        let pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        rect = new fabric.Rect({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x - origX,
            height: pointer.y - origY,
            fill: "#00000000",
            stroke: "#d79b00" + (strokeColorAlpha * 255).toString(16),
            strokeWidth: 2,
            strokeDashArray: [6, 3],
            cornerColor: 'transparent',
            rx: 5,
            ry: 5,
        });
        rect.hoverFillColor = "#ffe6cc" + (fillColorAlpha * 255).toString(16);
        rect.setControlsVisibility({ mtr: false }); // Hide the rotation control
        rect.on('moving', function () {
            updateIconPosition(this);
        });
        rect.annotation = '';
        canvas.add(rect);
    });

    canvas.on('mouse:move', function (o) {
        if (!isDrawing) return;
        let pointer = canvas.getPointer(o.e);

        if (origX > pointer.x) {
            rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
            rect.set({ top: Math.abs(pointer.y) });
        }

        rect.set({ width: Math.abs(origX - pointer.x) });
        rect.set({ height: Math.abs(origY - pointer.y) });

        canvas.renderAll();
    });

    canvas.on('mouse:up', function (o) {
        if (!isDrawing) {
            return;
        }

        // Remove the rectangle if it's too small
        if (rect.width < 20 || rect.height < 20) {
            canvas.remove(rect);
            canvas.renderAll();
        }
        isDrawing = false;
    });

    canvas.on('mouse:over', function (e) {
        if (e.target && e.target.type === 'rect') {
            const iconButton = document.getElementById('annotationIcons');
            const iconInfoButton = document.getElementById('annotationInfoIconButton');
            const rect = e.target;
            updateIconPosition(rect);

            // Store the reference to the rectangle for later use
            iconButton._associatedRect = rect;
            iconInfoButton._associatedRect = rect;

            isHovering = true;
            clearTimeout(hoverTimeout);

            rect.set('fill', rect.hoverFillColor);
            canvas.renderAll();
        }
    });

    canvas.on('mouse:out', function (e) {
        if (e.target && e.target.type === 'rect') {
            hoverTimeout = setTimeout(function () {
                if (isHovering) {
                    document.getElementById('annotationIcons').style.display = 'none';
                    isHovering = false;
                    const rect = e.target;
                    rect.set('fill', 'transparent');
                    canvas.renderAll();
                }
            }, 50);

        }
    });

    canvas.on('selection:created', updateInfoSidebar);
    canvas.on('selection:updated', updateInfoSidebar);

    // Allow deleting selected object with 'Delete' key
    window.addEventListener('keydown', function (e) {
        const annotationInput = document.getElementById('regionAnnotation');
        if (annotationInput === document.activeElement) {
            return; // Ignore if the annotation input is focused
        }

        // Check if 'Delete' key is pressed
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelectedObject();
        }
    });

    function deleteSelectedObject() {
        const activeObject = canvas.getActiveObject();
        const associatedRect = document.getElementById('annotationIcons')._associatedRect;
        if (activeObject) {
            // Check if the selection is a group of objects
            if (activeObject.type === 'activeSelection') {
                activeObject.forEachObject(function (obj) {
                    // Remove the associated rectangle if it's in the group
                    canvas.remove(obj);
                    if (obj === associatedRect) {
                        document.getElementById('annotationIcons').style.display = 'none';
                    }
                });
                // Deselect the group after deletion
                canvas.discardActiveObject();
            } else {
                // It's a single object, remove it directly
                if (activeObject === associatedRect) {
                    document.getElementById('annotationIcons').style.display = 'none';
                }
                canvas.remove(activeObject);
            }

            canvas.requestRenderAll(); // Re-render the canvas to reflect the changes
        }
    }
});

document.getElementById('annotationIcons').addEventListener('mouseenter', function () {
    isHovering = true;
    clearTimeout(hoverTimeout);
});

document.getElementById('annotationIcons').addEventListener('mouseleave', function () {
    isHovering = false;
    // Hide the icon after a brief moment unless the mouse goes back over the rectangle
    hoverTimeout = setTimeout(function () {
        document.getElementById('annotationIcons').style.display = 'none';
        isHovering = false;
    }, 100);
});

document.getElementById('regionAnnotation').addEventListener('input', function () {
    const annotationText = this.value;
    const iconButton = document.getElementById('annotationIcons');
    const associatedRect = iconButton._associatedRect;

    if (associatedRect) {
        associatedRect.annotation = annotationText; // Auto-save the annotation
    }
});

document.getElementById('closeInfoSidebar').addEventListener('click', function () {
    document.getElementById('infoSidebar').style.display = 'none';
    document.getElementById('saveBtnContainer').style.marginRight = '0';
});

document.getElementById('annotationInfoIconButton').addEventListener('click', function () {
    const infoSidebar = document.getElementById('infoSidebar');
    infoSidebar.style.display = 'block';
    infoSidebar.scrollTop = 0; // Scroll to the top
    canvas.setActiveObject(document.getElementById('annotationInfoIconButton')._associatedRect);

    const saveBtn = document.getElementById('saveBtnContainer');
    saveBtn.style.marginRight = '160px';
});

document.getElementById('borderColorPicker').addEventListener('input', function (e) {
    const newColor = e.target.value;

    // Assuming you have a reference to the rectangle
    // Update this part to get the selected rectangle if needed
    const rect = canvas.getActiveObject();

    // Get and keep current alpha value
    const rgbaColor = newColor + (strokeColorAlpha * 255).toString(16);

    if (rect && rect.type === 'rect') {
        rect.set({ stroke: rgbaColor });
        canvas.renderAll();
    }
});


document.getElementById('fillColorPicker').addEventListener('input', function (e) {
    const newColor = e.target.value;

    // Assuming you have a reference to the rectangle
    // Update this part to get the selected rectangle if needed
    const rect = canvas.getActiveObject();

    // Get and keep current alpha value
    const rgbaColor = newColor + (fillColorAlpha * 255).toString(16);

    if (rect && rect.type === 'rect') {
        rect.hoverFillColor = rgbaColor;
        rect.set({ fill: rgbaColor });
        canvas.renderAll();
    }
});

document.getElementById('analysisSaveBtn').addEventListener('click', function () {
    // Serialize the canvas to JSON string
    if (canvas) {
        const json = JSON.stringify(canvas.toJSON(['annotation', 'hoverFillColor']));
        window.electronAPI.saveImage(json, "test/analysis.json");
    }
});