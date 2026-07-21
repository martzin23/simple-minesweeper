let _total = 0;
let _mines = 0;
let _uncovered = 0;
let _grid = null;
const settings = {
    "grid_small" : [8, 12],
    "grid_large" : [16, 24],
    "grid_few" : 0.10,
    "grid_lot" : 0.25,
};

class Cell {
    constructor(id, value, element) {
        this.id = id;
        this.element = element;
        this.neighbours = [null, null, null, null, null, null, null, null];
        this.value = value;
        this.revealed = false;
        this.flagged = false;

        this.pointerdown_handler = (event) => {
            let pointerup_handler = (event) => {
                clearTimeout(id);

                if (event.button == 0)
                    this.reveal();
                else if (event.button == 2)
                    this.toggleFlag();

                this.element.removeEventListener("pointerup", pointerup_handler);
                this.element.removeEventListener("mouseleave", mouseleave_handler);
            }
            let mouseleave_handler = (event) => {
                clearTimeout(id);
                this.element.removeEventListener("pointerup", pointerup_handler);
                this.element.removeEventListener("mouseleave", mouseleave_handler);
            }
            this.element.addEventListener("pointerup", pointerup_handler);
            this.element.addEventListener("mouseleave", mouseleave_handler);
            let id = setTimeout(() => {
                this.toggleFlag();
                this.element.removeEventListener("pointerup", pointerup_handler);
                this.element.removeEventListener("mouseleave", mouseleave_handler);
            }, 250);
        }
    }

    reveal(user = true) {
        if (this.flagged && user) return;
        this.element.classList.remove("uncovered");
        this.element.classList.remove("clickable");
        this.element.removeEventListener("pointerdown", this.pointerdown_handler);
        this.revealed = true;
        if (user) _uncovered++;
        if (this.value == "mine" && user)
            this.floodFill((cell) => {cell.flashRed(); cell.reveal(false)});
            // iterateGrid((cell) => {cell.flashRed(); cell.reveal(false)});
        // else if (this.value == "zero" && user)
        //     this.floodFill((cell) => {cell.reveal(false); cell.flashGreen();}, (cell) => {return cell.value == "zero"});
        else if (_uncovered == _total - _mines)
            iterateGrid((cell) => {
                cell.flashGreen(); 
                cell.element.removeEventListener("pointerdown", cell.pointerdown_handler); 
                cell.element.classList.remove("clickable");
            });
    }

    toggleFlag() {
        this.element.classList.toggle("flag");
        let counter_element = document.getElementById("mines");
        counter_element.innerText = parseInt(counter_element.innerText) + (this.flagged ? 1 : -1);
        this.flagged = !this.flagged;
    }

    floodFill(lambda = (cell) => {}, condition = (cell) => true) {
        let current = this.neighbours;
        lambda(this);
        let filled = {};
        filled[this.id] = this;
        let next = {};
        let depth = 0;
        let counter = 0;
        
        let floodfill_step = () => {
            console.log(countNonNull(current), current, filled);
            if (depth > 10) return;
            if (current.length == 0) return;
            current.forEach((c, i) => {
                if (!c) return;
                lambda(c);
                filled[c.id] = c;
                if (!condition(c)) return;
                console.log(c.neighbours)
                c.neighbours.forEach((n, i) => {
                    if (!!n && !!filled[n.id])
                        next[n.id] = n;
                });
            });
            // current = next;
            current = Object.values(next);
            next = {};
            depth++;
            // if (depth < 5)
            //     setTimeout(floodfill_step, 500);
            // else
                floodfill_step();
        }
        setTimeout(floodfill_step, 500);
    }

    flashGreen() {
        this.element.style.animationName = "flash_green";
        setTimeout(() => {this.element.style.animationName = ""}, 1000);
    }

    flashRed() {
        this.element.style.animationName = "flash_red";
        setTimeout(() => {this.element.style.animationName = ""}, 1000);
    }
}

function generateGrid(width, height, mines) {
    _total = width * height;
    _mines = mines;
    let counter_element = document.getElementById("mines");
    counter_element.innerText = _mines;

    let grid_values = [];
    for (let y=0; y<height; y++) {
        let column = [];
        for (let x=0; x<width; x++)
            column.push("");
        grid_values.push(column);
    }

    for (let i=0; i<mines;) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);

        if (grid_values[y][x] == "mine")
            continue
        grid_values[y][x] = "mine";
        i++;
    }

    const numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    for (let x=0; x<width; x++) {
        for (let y=0; y<height; y++) {
            if (grid_values[y][x] == "mine")
                continue
            count = 0;

            if (x > 0 && grid_values[y][x-1] == "mine") count += 1;
            if (x < width-1 && grid_values[y][x+1] == "mine") count += 1;
            if (y > 0 && grid_values[y-1][x] == "mine") count += 1;
            if (y < height-1 && grid_values[y+1][x] == "mine") count += 1;
            if (x > 0 && y > 0 && grid_values[y-1][x-1] == "mine") count += 1;
            if (x < width-1 && y < height-1 && grid_values[y+1][x+1] == "mine") count += 1;
            if (x < width-1 && y > 0 && grid_values[y-1][x+1] == "mine") count += 1;
            if (x > 0 && y < height-1 && grid_values[y+1][x-1] == "mine") count += 1;

            grid_values[y][x] = numbers[count];
        } 
    }
    return grid_values;
}

function fillGrid(grid_values) {

    const height = grid_values.length;
    const width = grid_values[0].length;
    let grid_element = document.getElementById("grid");
    grid_element.innerHTML = "";
    let grid_instances = [];

    for (let y=0; y<height; y++) {
        let column_classes = [];
        for (let x=0; x<width; x++) {
            let cell = document.createElement("div");
            cell.setAttribute("class", `cell ${grid_values[y][x]} uncovered clickable`);
            grid_element.appendChild(cell);
            column_classes.push(new Cell(`x${x}y${y}`, grid_values[y][x], cell));
        }
        grid_instances.push(column_classes);
    }
    grid_element.style.gridTemplateColumns = `repeat(${grid_values[0].length}, auto)`;

    for (let y=0; y<height; y++) {
        for (let x=0; x<width; x++) {
            let neighbours = [null, null, null, null, null, null, null, null];
            if (x > 0) neighbours[0] = grid_instances[y][x-1];
            if (x < width-1) neighbours[4] = grid_instances[y][x+1];
            if (y > 0) neighbours[2] = grid_instances[y-1][x];
            if (y < height-1) neighbours[6] = grid_instances[y+1][x];
            if (x > 0 && y > 0) neighbours[5] = grid_instances[y-1][x-1];
            if (x < width-1 && y < height-1) neighbours[1] = grid_instances[y+1][x+1];
            if (x < width-1 && y > 0) neighbours[3] = grid_instances[y-1][x+1];
            if (x > 0 && y < height-1) neighbours[7] = grid_instances[y+1][x-1];
            grid_instances[y][x].neighbours = neighbours;
        }
    }
    
    for (let y=0; y<height; y++) {
        for (let x=0; x<width; x++) {
            let cell_element = grid_instances[y][x].element;
            let cell_instance = grid_instances[y][x];
            cell_element.addEventListener("pointerdown", cell_instance.pointerdown_handler);
            cell_element.addEventListener("contextmenu", (event) => {event.preventDefault();})
        }
    }

    _grid = grid_instances;
}

function iterateGrid(func = (cell) => {}) {
    const height = _grid.length;
    const width = _grid[0].length;
    for (let y=0; y<height; y++)
        for (let x=0; x<width; x++)
            func(_grid[y][x]);
}

function countNonNull(array) {
    let counter = 0;
    array.forEach((x,i) => {if (!!x) counter++;});
    return counter;
}

function toggleFullscreen() {
    if (isFullscreen()) {
        if (document.exitFullscreen)
            document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen)
            document.webkitExitFullscreen().catch(() => {});
        else if (document.msExitFullscreen)
            document.msExitFullscreen().catch(() => {});
    } else {
        if (document.documentElement.requestFullscreen)
            document.documentElement.requestFullscreen();
        else if (document.documentElement.webkitRequestFullscreen)
            document.documentElement.webkitRequestFullscreen();
        else if (eldocument.documentElementem.msRequestFullscreen)
            document.documentElement.msRequestFullscreen();
    }
}

function isFullscreen() {
    return (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) !== undefined;
}

function buttonSetup() {
    const menu_element = document.getElementById("menu");
    const grid_element = document.getElementById("grid");
    const reset_button = document.getElementById("reset");
    const indicator_element = document.getElementById("indicator");
    const title_element = document.getElementById("title");

    reset_button.addEventListener("click", (event) => {
        reset_button.classList.add("hidden");
        menu_element.classList.remove("hidden");
        grid_element.classList.add("hidden");
        indicator_element.classList.add("hidden");
        title_element.classList.remove("hidden");
    });

    const maximize_button = document.getElementById("maximize");
    maximize_button.addEventListener("click", (event) => {toggleFullscreen();});
    const minimize_button = document.getElementById("minimize");
    minimize_button.addEventListener("click", (event) => {toggleFullscreen();});
    
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((eventType) => {
        document.addEventListener(eventType, () => {
            if (!isFullscreen()) {
                minimize_button.classList.add("hidden");
                maximize_button.classList.remove("hidden");
            }
            else if (isFullscreen()) {
                minimize_button.classList.remove("hidden");
                maximize_button.classList.add("hidden");
            }
        })
    });

    Array.prototype.subarray = function(start, end) {
        if (!end) end = this.length - 1;
        return this.splice(start, end);
    }

    let grid_buttons = Array.from(document.getElementById("switch_size").children);
    grid_buttons.forEach((x) => {
        x.addEventListener("click", (event) => {
            grid_buttons.forEach((x) => {x.classList.remove("selected")});
            x.classList.add("selected");
        });
    });

    let mines_buttons = Array.from(document.getElementById("switch_mines").children);
    mines_buttons.forEach((x) => {
        x.addEventListener("click", (event) => {
            mines_buttons.forEach((x) => {x.classList.remove("selected")});
            x.classList.add("selected");
        });
    });

    const start_button = document.getElementById("start");
    start_button.addEventListener("click", (event) => {
        menu_element.classList.add("hidden");
        grid_element.classList.remove("hidden");
        reset_button.classList.remove("hidden");
        indicator_element.classList.remove("hidden");
        title_element.classList.add("hidden");
        
        let mines = 0;
        let grid = [0, 0];

        mines_buttons.forEach((x) => {if (x.value && x.classList.contains("selected")) mines = Math.floor(x.value * _total)});
        grid_buttons.forEach((x) => {if (x.value && x.classList.contains("selected")) grid = JSON.parse(x.value)});

        fillGrid(generateGrid(grid[0], grid[1], mines));
    });
}

fillGrid(generateGrid(10, 10, 25));
buttonSetup();