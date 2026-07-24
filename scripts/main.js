
class Cell {
    constructor(id, element) {
        this.id = id;
        this.element = element;
        this.neighbours = [null, null, null, null, null, null, null, null];

        this.pointerdown_handler = (event) => {
            let pointerup_handler = (event) => {
                clearTimeout(id);

                if (event.button == 0)
                    this.interact();
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
        
        this.element.addEventListener("contextmenu", (event) => {event.preventDefault();})
        this.element.addEventListener("pointerdown", this.pointerdown_handler);
    }

    interact() {
        if (this.isFlagged() || this.isRevealed()) return;
        this.reveal();
        if (this.element.value === "mine") {
            // _game.backgroundRed();
            this.flashRed();
            this.floodFill((cell) => {
                if (cell.isRevealed()) return;
                cell.flashRed(); 
                cell.reveal();
            }, () => true, true, 25);
        } else {
            this.flashGreen();
            if (this.element.value === "zero")
                this.floodFill((cell) => {
                    if (cell.isRevealed()) return;
                    cell.flashGreen();
                    cell.reveal();
                }, (cell) => {return cell.element.value === "zero"}, true, 50, () => {
                    if (_game.countUnrevealed() === _game.mines) 
                        _game.backgroundGreen();
                });
            if (_game.countUnrevealed() === _game.mines) {
                _game.backgroundGreen();
                this.floodFill((cell) => {
                    cell.flashGreen(); 
                    cell.reveal();
                }, () => true, true);
            }
        }
    }

    reveal() {
        this.element.classList.remove("unrevealed");
        this.element.classList.remove("clickable");
        this.element.classList.remove("flagged");
        this.element.removeEventListener("pointerdown", this.pointerdown_handler);
    }

    toggleFlag() {
        this.element.classList.toggle("flagged");
        _game.container_counter.innerText = parseInt(_game.container_counter.innerText) + (this.isFlagged() ? -1 : 1);
        this.flashWhite();
    }

    floodFill(lambda = (cell) => {}, condition = (cell) => true, diagonal = false, delay = 50, finish = () => {}) {
        let current = this.neighbours;
        lambda(this);
        let filled = [this.id];
        let next = [];
        
        let floodfill_step = () => {
            if (current.length == 0) {
                finish();
                return;
            } 
            current.forEach((c, i) => {
                if (!c) return;
                lambda(c);
                if (!filled.includes(c.id))
                    filled.push(c.id);
                else
                    return
                filled[c.id] = c;
                if (!condition(c)) return;
                c.neighbours.forEach((n, i) => {
                    if (i%2 != 0 && !diagonal) return;
                    if (!!n && !filled.includes(n.id))
                        next[n.id] = n;
                });
            });
            current = Object.values(next);
            next = {};
            setTimeout(floodfill_step, delay);
        }
        setTimeout(floodfill_step, delay);
    }

    flashGreen() {
        this.element.style.animationName = "flash_green";
        setTimeout(() => {this.element.style.animationName = ""}, 1000);
    }

    flashRed() {
        this.element.style.animationName = "flash_red";
        setTimeout(() => {this.element.style.animationName = ""}, 1000);
    }

    flashWhite() {
        this.element.style.animationName = "flash_white";
        this.element.style.animationDuration = "0.5s";
        this.element.style.zIndex = "10";
        setTimeout(() => {
            this.element.style.animationName = "";
            this.element.style.animationDuration = "1s";
            this.element.style.zIndex = "initial";
        }, 1000);
    }

    isFlagged() {
        return this.element.classList.contains("flagged");
    }

    isRevealed() {
        return !this.element.classList.contains("unrevealed");
    }
}

class Game {
    constructor() {
        this.mines = 0;
        this.total = 0;
        this.grid = null;
        this.container_grid = document.getElementById("grid");
        this.container_counter = document.getElementById("counter");
        this.container_main = document.querySelector("main");
        this.buttonSetup();
    }

    generateGrid(width, height, mines) {
        this.total = width * height;
        this.mines = mines;
        this.container_grid.innerHTML = "";
        this.container_counter.innerText = mines;

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
        
        let grid_instances = [];
        for (let y=0; y<height; y++) {
            let temp = [];
            for (let x=0; x<width; x++) {
                let cell = document.createElement("div");
                if (grid_values[y][x] === "mine") {
                    temp.push(new Cell(`x${x}y${y}`, cell));
                    cell.setAttribute("class", `cell mine unrevealed clickable`);
                    cell.value = "mine";
                }
                else {
                    temp.push(new Cell(`x${x}y${y}`, cell));
                    cell.setAttribute("class", `cell unrevealed clickable`);
                } 
                this.container_grid.appendChild(cell);
            }
            grid_instances.push(temp);
        }
        this.container_grid.style.gridTemplateColumns = `repeat(${grid_values[0].length}, auto)`;

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
        
        const numbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
        grid_instances.forEach((x) => {
            x.forEach((x) => {
                if (x.element.value === "mine") return;
                let counter = 0;
                x.neighbours.forEach((n) => {if (!!n && n.element.classList.contains("mine")) counter++;});
                x.element.classList.add(numbers[counter]);
                x.element.value = numbers[counter];
            });
        });        

        this.grid = grid_instances;
    }

    buttonSetup() {
        const container_menu = document.getElementById("menu");
        const container_indicator = document.getElementById("indicator");
        const container_title = document.getElementById("title");
        const container_header = document.querySelector("header");
        const button_reset = document.getElementById("button_reset");
        const button_maximize = document.getElementById("button_maximize");
        const button_minimize = document.getElementById("button_minimize");
        const button_start = document.getElementById("button_start");
        const switch_mines = document.getElementById("switch_mines");
        const switch_size = document.getElementById("switch_size");

        button_reset.addEventListener("click", (event) => {
            _game.backgroundNeutral();
            button_reset.classList.add("hidden");
            container_menu.classList.remove("hidden");
            this.container_grid.classList.add("hidden");
            container_indicator.classList.add("hidden");
            container_title.classList.remove("hidden");
        });

        button_maximize.addEventListener("click", (event) => {this.toggleFullscreen();});
        button_minimize.addEventListener("click", (event) => {this.toggleFullscreen();});
        
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((eventType) => {
            document.addEventListener(eventType, () => {
                if (!this.isFullscreen()) {
                    button_minimize.classList.add("hidden");
                    button_maximize.classList.remove("hidden");
                }
                else if (this.isFullscreen()) {
                    button_minimize.classList.remove("hidden");
                    button_maximize.classList.add("hidden");
                }
            })
        });

        let grid_buttons = Array.from(switch_size.children);
        grid_buttons.forEach((x) => {
            x.addEventListener("click", (event) => {
                grid_buttons.forEach((x) => {x.classList.remove("selected")});
                x.classList.add("selected");
            });
        });

        let mines_buttons = Array.from(switch_mines.children);
        mines_buttons.forEach((x) => {
            x.addEventListener("click", (event) => {
                mines_buttons.forEach((x) => {x.classList.remove("selected")});
                x.classList.add("selected");
            });
        });

        button_start.addEventListener("click", (event) => {
            container_menu.classList.add("hidden");
            this.container_grid.classList.remove("hidden");
            button_reset.classList.remove("hidden");
            container_indicator.classList.remove("hidden");
            container_title.classList.add("hidden");
            
            let mines = 0;
            let grid = [0, 0];

            grid_buttons.forEach((x) => {
                if (x.value && x.classList.contains("selected")) {
                    const padding = 3 * 6;
                    const cell = 3 * 10;
                    const header = container_header.clientHeight;
                    const width = document.documentElement.clientWidth - 2 * padding;
                    const height = document.documentElement.clientHeight - header - 2 * padding;
                    const max_grid = [Math.floor(width / cell) + 1, Math.floor(height / cell) + 1];

                    if (x.value == "full") {
                        grid = max_grid;
                    } else {
                        grid = JSON.parse(x.value)
                        grid = [Math.min(grid[0], max_grid[0]), Math.min(grid[1], max_grid[1])];
                    }
                }
            });
            mines_buttons.forEach((x) => {if (x.value && x.classList.contains("selected")) mines = Math.floor(x.value * grid[0] * grid[1])});

            this.generateGrid(grid[0], grid[1], mines);
            // this.generateGrid(grid[0], grid[1], 2);
        });
    }

    toggleFullscreen() {
        if (this.isFullscreen()) {
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

    isFullscreen() {
        return (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) !== undefined;
    }

    backgroundNeutral() {
        this.container_main.style.backgroundColor = "var(--medium)";
        this.container_main.style.borderColor = " var(--light)";
    }

    backgroundRed() {
        this.container_main.style.backgroundColor = "var(--red-dark)";
        this.container_main.style.borderColor = " var(--red-medium)";
    }

    backgroundGreen() {
        this.container_main.style.backgroundColor = "var(--green-dark)";
        this.container_main.style.borderColor = " var(--green-medium)";
    }

    countUnrevealed() {
        let counter = 0;
        this.grid.forEach((column) => {
            column.forEach((cell) => {
                if (cell.element.classList.contains("unrevealed"))
                    counter++;
            });
        });
        return counter;
    }
}

let _game = new Game();
