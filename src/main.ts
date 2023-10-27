import "./app.postcss";
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
});

export default app;




Array.prototype.insert_at = function(index, element)
{
    this.splice(index, 0, element);
    return this;
}

Array.prototype.insert_after = function(after, element)
{
    let after_idx = this.findIndex((t) => t == after);

    if(after_idx == this.length - 1)
    {
        this.push(element)
    }
    else
    {
        this.insert_at(after_idx+1, element)
    }
    
    return this;
}

Array.prototype.prev = function(element)
{
    let idx = this.findIndex((t) => t == element);
    if(idx < 1)
        return null;
    else
        return this[idx-1];
}

Array.prototype.next = function(element)
{
    let idx = this.findIndex((t) => t == element);
    if(idx >= this.length-1)
        return null;
    else
        return this[idx+1];
}

Array.prototype.remove_at = function(index)
{
    this.splice(index, 1)
    return this;
}

Array.prototype.remove = function(element)
{
    let idx = this.findIndex((t) => t == element);
    this.remove_at(idx);
    return this;
}

Array.prototype.swap = function(e1, e2)
{
    let idx1 = this.findIndex((t) => t == e1);
    let idx2 = this.findIndex((t) => t == e2);

    this[idx1] = e2;
    this[idx2] = e1;

    return this;
}


