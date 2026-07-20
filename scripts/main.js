let _total = 0;
let _mines = 0;
let _uncovered = 0;
let _grid = null;

class Cell {
    constructor(id, value, element) {
        this.id = id;
        this.element = element;
        this.neighbours = [null, null, null, null, null, null, null, null];
        this.value = value;
        this.revealed = false;
        this.flagged = false;
        this.flooded = false;

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
        else if (this.value == "zero" && user)
            this.floodFill((cell) => {cell.reveal(false); cell.flashGreen();}, {}, (cell) => {return cell.value == "zero"});
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

    floodFill(lambda = (cell) => {}, filled = {}, condition = (cell) => true) {
        // filled[this.id] = true;
        this.flooded = true;
        lambda(this);
        if (!condition(this)) return;
        for (let i=0; i<this.neighbours.length; i++) {
            let n = this.neighbours[i];
            // if (!!n && filled[n.id] !== true)
            if (!!n && !n.flooded)
                setTimeout(() => {n.floodFill(lambda, filled, condition)}, 500);
        }
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
    let grid_element = document.querySelector("footer");
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

fillGrid(generateGrid(20, 20, 10));
document.getElementById("reset").addEventListener("click", (event) => {fillGrid(generateGrid(5, 5, 5));});