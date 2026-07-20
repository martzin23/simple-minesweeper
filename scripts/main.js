
function main() {
    let grid = document.querySelector("footer");
    for (let i=0; i<16; i++) {
        let cell = document.createElement("div");
        let types = ["empty", "flag", "mine", "unmarked", "one"];
        cell.setAttribute("class", `cell ${types[Math.floor(Math.random()*types.length)]}`);
        grid.appendChild(cell);
    }
    return;
};

function generateGrid(width, height, mines) {
    let grid = [];
    for (let y=0; y<height; y++) {
        let column = [];
        for (let x=0; x<width; x++)
            column.push("");
        grid.push(column);
    }

    console.log(grid);

    for (let i=0; i<mines;) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);

        if (grid[y][x] == "mine")
            continue
        grid[y][x] = "mine";
        i++;
    }

    let numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

    for (let x=0; x<width; x++) {
        for (let y=0; y<height; y++) {
            if (grid[y][x] == "mine")
                continue
            count = 0;
            if (x > 0 && grid[y][x-1] == "mine") count += 1;
            if (x < width-1 && grid[y][x+1]== "mine") count += 1;
            if (y > 0 && grid[y-1][x]== "mine") count += 1;
            if (y < width-1 && grid[y+1][x]== "mine") count += 1;
            if (x > 0 && y > 0 && grid[y][x-1]== "mine") count += 1;
            if (x < width-1 && y < height-1 && grid[y][x-1]== "mine") count += 1;
            if (x < width-1 && y > 0 && grid[y][x-1]== "mine") count += 1;
            if (x > 0 && y < height-1 && grid[y][x-1]== "mine") count += 1;

            grid[y][x] = numbers[count];
        }
    }
    return grid;
}

function fillGrid(grid) {
    console.log(grid);
    let grid_element = document.querySelector("footer");
    for (let y=0; y<grid.length; y++) {
    for (let x=0; x<grid[y].length; x++) {
            let cell = document.createElement("div");
            cell.setAttribute("class", `cell ${grid[y][x]}`);
            grid_element.appendChild(cell);
        }
    }
    grid_element.style.gridTemplateColumns = `repeat(${grid[0].length}, auto)`;
    
    // grid-template-columns: repeat(4, auto);
}

// main();
fillGrid(generateGrid(5, 6, 5));