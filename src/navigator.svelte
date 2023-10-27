<script >
    import {Spinner, show_menu, start_editing, Sidebar, SidebarBrand, SidebarGroup, SidebarItem} from '@humandialog/forms.svelte'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash} from 'svelte-icons/fa'
    import {reef, session, Authorized} from '@humandialog/auth.svelte'
    import { onMount, afterUpdate } from "svelte";
    import {location, push} from 'svelte-spa-router'
    
    let tasklists = [];
    let user = {};
    let just_have_completed_lists = false;

    $: current_path = $location;
    
    //$: checklists = $all_lists;

    onMount(async () => {
        if(!$session.is_active)
            return;

        let res = await reef.get("/user");
        if(res != null)
            user = res.User;

        
        res = await reef.get("/app/Lists?sort=Order&fields=Id,Name,Order");
        if(res != null)
        {
            tasklists = res.TaskList;
            just_have_completed_lists = true;
        }
        else
            tasklists = [];
    });

    afterUpdate(() => {
        
        if(!$session.is_active)
            return;

        if(just_have_completed_lists)
        {
            just_have_completed_lists = false;
            navigate_to_default_list_if_needed();
        }
    });

    function navigate_to_default_list_if_needed()
    {
        if($location == "" || $location == "/")
            push('/mytasks');
    }

    

    async function add_list(list_name)
    {
        let res = await reef.post("/app/Lists/new", 
                                    { 
                                        Name: list_name 
                                    });
        if(res != null)
        {
            let obj = res.TaskList[0];
            tasklists = tasklists.concat(obj);
            return true;
        }
        else
            return false;
    }

    async function delete_list(list)
    {
        let res = await reef.delete(`/app/Lists/${list.Id}`)
        if(res != null)
        {
            tasklists = tasklists.filter(e => e.Id != list.Id);
            if($location == "/tasklist/"+list.Id)
            {
                if(tasklists.length > 0)
                    push('/tasklist/'+tasklists[0].Id);
                else
                    push('/');
            }
        }
    }

    async function change_name(list, name)
    {
        let res = await reef.post(`/app/Lists/${list.Id}/set`, 
                                {
                                    Name: name
                                });
        if(res != null)
            return true;
        else
            return false;
    }

    async function finish_all_on_list(list)
    {
        const STATUS_CLOSED = 2;
        let res = await reef.get(`/app/Lists/${list.Id}/Tasks?Status<>${STATUS_CLOSED}&fields=Id`)
        if(!res)
            return;

        let tasks_ids = res.Task;
        let tasks = tasks_ids.map( ({Id}) => 
                                    ({ 
                                        Id: Id,  
                                        Status: STATUS_CLOSED
                                    }) );
        
        res = await reef.post(`/app/Lists/${list.Id}/Tasks/set`, tasks);
        
        //todo: refresh view if needed

    }

    async function finish_all_my_tasks()
    {
        const STATUS_CLOSED = 2;
        let res = await reef.get(`/user/MyTasks?Status<>${STATUS_CLOSED}&fields=Id`)
        if(!res)
            return;

        let tasks_ids = res.Task;
        let tasks = tasks_ids.map( ({Id}) => 
                                    ({ 
                                        Id: Id,  
                                        Status: STATUS_CLOSED
                                    }) );
        
        res = await reef.post(`/user/MyTasks/set`, tasks);
        
        //todo: refresh view if needed

    }

    async function move_list_up(list)
    {
        let prev = tasklists.prev(list);
        if(!prev)
            return;

        [prev.Order, list.Order] = [list.Order, prev.Order];
        tasklists.swap(prev, list);

        let res = await reef.get(`/app/Lists/${list.Id}/MoveUp`)
        if(res)
            list.Order = res.TaskList.Order
    }

    async function move_list_down(list)
    {
        let next = tasklists.next(list);
        if(!next)
            return;

        [next.Order, list.Order] = [list.Order, next.Order]
        tasklists.swap(list, next);

        let res = await reef.get(`/app/Lists/${list.Id}/MoveDown`)
        if(res)
            list.Order = res.TaskList.Order
    }
    
    function active(href, current_path)
    {
        let link_path = href;
        link_path.startsWith('#')
            link_path = link_path.substring(1)

        if(current_path.startsWith(link_path))
            return true;
        else
            return false;
    }


    function on_context_menu(e, itm)
    {
        let menu_operations = [];
        if(itm == user)
            menu_operations.push({
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (focused) => finish_all_my_tasks()
            });
        else
        {
            menu_operations = [
                {
                    caption: 'Rename',
                    action: (focused) => start_editing(e.target)
                },
                {
                    caption: 'Finish all',
                    icon: FaRegCheckCircle,
                    action: (focused) => finish_all_on_list(itm)
                },
                {
                    caption: 'Move up',
                    icon: FaCaretUp,
                    action: (focused) => move_list_up(itm)
                },
                {
                    caption: 'Move down',
                    icon: FaCaretDown,
                    action: (focused) => move_list_down(itm)

                },
                {
                    separator: true
                },
                {
                    caption: 'Delete',
                    icon: FaTrash,
                    action: (focused) => delete_list(itm)
                }
            ]
        }

        show_menu(new DOMPoint(e.clientX, e.clientY), menu_operations)

        //e.stopPropagation();
        e.preventDefault();
    }
  </script>
  
  <Authorized>
    <Sidebar>
        <SidebarBrand img="https://objectreef.dev/reef.svg">
            Octopus <span class="font-thin">mini</span>
        </SidebarBrand>
           
            {#if tasklists && tasklists.length > 0}
                {@const is_active=active("#/mytasks", current_path)}
            
            <SidebarGroup>
                <SidebarItem   href="#/mytasks"
                                icon={FaList}
                                active={is_active}
                                on:contextmenu={(e) => on_context_menu(e, user)}
                                on:click={(e) => on_context_menu(e, user)}
                                selectable={user}>
                    My Tasks
                </SidebarItem>
            </SidebarGroup>

            <SidebarGroup border inserter={add_list} inserter_placeholder='New list'>
                {#each tasklists as list (list.Id)}
                    {@const href = `#/tasklist/${list.Id}`}
                    {@const is_active = active(href, current_path)}
                    <SidebarItem   {href}
                                    icon={FaList}
                                    active={is_active}
                                    on:contextmenu={(e) => on_context_menu(e, list)}
                                    on:click={(e) => on_context_menu(e, list)}
                                    selectable={list}
                                    editable={(text) => {change_name(list, text)}}>
                        {list.Name}
                    </SidebarItem>
                {/each }
               
            </SidebarGroup>
            
            {:else}
                <Spinner/>
            {/if}

        </Sidebar>
</Authorized>


    
