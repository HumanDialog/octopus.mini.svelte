<script>
    import {Spinner, startEditing, Sidebar, SidebarBrand, SidebarGroup, SidebarItem, SidebarList, setNavigatorTitle, reloadMainContentPage} from '@humandialog/forms.svelte'
    import {FaList, FaRegCheckCircle, FaCaretUp, FaCaretDown, FaTrash} from 'svelte-icons/fa'
    import {reef, session, Authorized} from '@humandialog/auth.svelte'
    import { onMount, afterUpdate } from "svelte";
    import {location, push} from 'svelte-spa-router'
    
    export let sidebar = true;

    let taskLists = [];
    let user = {};
    let navLists;
    
    $: currentPath = $location;

    onMount(async () => {
        await initNavigator();
        return () => {}
    });

    async function initNavigator()
    {
        if(!$session.isActive)
            return;
        
        let res = await reef.get("/user");
        if(res != null)
            user = res.User;


        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.get("/app/Lists?sort=Order&fields=Id,Name,Order,$type");
        if(res != null)
        {
            taskLists = res.TaskList;
            //justHaveCompletedLists = true;
        }
        else
            taskLists = [];
    }

    async function reload()
    {
        await fetchData();
        navLists.reload(taskLists)
    }

    /*afterUpdate(() => {
        
        if(!$session.isActive)
            return;

        if(justHaveCompletedLists)
        {
            justHaveCompletedLists = false;
            navigateToDefaultListIfNeeded();
        }
    });*/
    
    /*const title = `Octopus <span class="font-thin">mini</span>`
    setNavigatorTitle('TOC', title)

    function navigateToDefaultListIfNeeded()
    {
        if($location == "" || $location == "/")
            push('/mytasks');
    }
*/
    async function addList(listName, order)
    {
        await reef.post("/app/Lists/new", 
                            { 
                                Name: listName,
                                Order: order
                            });
        reload();
    }

    async function deleteList(list)
    {
        await reef.delete(`/app/Lists/${list.Id}`)
        reload();
    }

    async function changeName(list, name)
    {
        let res = await reef.post(`/app/Lists/${list.Id}/set`, 
                                {
                                    Name: name
                                });
        return (res != null);
    }

    async function finishAllOnList(list)
    {
        await reef.get(`/app/Lists/${list.Id}/FinishAll`)
        
        if(isRoutingTo(`#/tasklist/${list.Id}`, currentPath))
        {
            reloadMainContentPage();
        }
    }

    async function finishAllMyTasks()
    {       
        await reef.get(`/user/FinishTasks`)
        
        if(isRoutingTo('#/mytasks', currentPath))
        {
            reloadMainContentPage();
        }

    }

    function isRoutingTo(href, currentPath)
    {
        if(!sidebar)
            return false;

        let linkPath = href;
        linkPath.startsWith('#')
            linkPath = linkPath.substring(1)

        if(currentPath.startsWith(linkPath))
            return true;
        else
            return false;
    }
    
    function getUserListOperations(domNode, dataItem)
    {
        let menuOperations = [];
        if(dataItem == user)
            menuOperations.push({
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (f) => finishAllMyTasks()
            });

        return menuOperations;
    }

    function getTaskListOperations(domNode, dataItem)
    {
        let menuOperations = [];
        menuOperations = [
            {
                caption: 'Rename',
                action: (f) => startEditing(domNode)
            },
            {
                caption: 'Finish all',
                icon: FaRegCheckCircle,
                action: (f) => finishAllOnList(dataItem)
            },
            {
                caption: 'Move up',
                icon: FaCaretUp,
                action: (f) => navLists.moveUp(dataItem)
            },
            {
                caption: 'Move down',
                icon: FaCaretDown,
                action: (f) => navLists.moveDown(dataItem)

            },
            {
                separator: true
            },
            {
                caption: 'Delete',
                icon: FaTrash,
                action: (f) => deleteList(dataItem)
            }
        ]
        return menuOperations
    }

    export function requestAddList()
    {
        navLists.add(async (listName, order) => {
            await reef.post("/app/Lists/new", 
                            { 
                                Name: listName,
                                Order: order
                            });
            reload();
        })
    }

  </script>
  
  {#if sidebar}
           
            {#if taskLists && taskLists.length > 0}
                <SidebarGroup>
                    <SidebarItem   href="#/mytasks"
                                    icon={FaList}
                                    active={isRoutingTo("#/mytasks", currentPath)}
                                    operations={(node) => getUserListOperations(node, user)}
                                    selectable={user}>
                        My Tasks
                    </SidebarItem>
                </SidebarGroup>

                <SidebarGroup border>
                    <SidebarList    objects={taskLists} 
                                    orderAttrib='Order'
                                    inserter={addList} 
                                    inserterPlaceholder='New list'
                                    bind:this={navLists}>
                        <svelte:fragment let:item>
                            {@const href = `#/tasklist/${item.Id}`}
                            <SidebarItem   {href}
                                            icon={FaList}
                                            active={isRoutingTo(href, currentPath)}
                                            operations={(node) => getTaskListOperations(node, item)}
                                            selectable={item}
                                            editable={(text) => {changeName(item, text)}}>
                                {item.Name}
                            </SidebarItem>
                        </svelte:fragment>
                    </SidebarList> 
                </SidebarGroup>
            
            {:else}
                <Spinner delay={3000}/>
            {/if}

{:else}
        {#if taskLists && taskLists.length > 0}
            <SidebarGroup>
                <SidebarItem   href="#/mytasks"
                                icon={FaList}
                                operations={(node) => getUserListOperations(node, user)}
                                item={user}>
                    My Tasks
                </SidebarItem>
            </SidebarGroup>

            <SidebarGroup border>
                <SidebarList    objects={taskLists} 
                                orderAttrib='Order'
                                bind:this={navLists}>
                    <svelte:fragment let:item>
                        {@const href = `#/tasklist/${item.Id}`}
                        <SidebarItem   {href}
                                        icon={FaList}
                                        operations={(node) => getTaskListOperations(node, item)}
                                        {item}
                                        editable={(text) => {changeName(item, text)}}>
                            {item.Name}
                        </SidebarItem>
                    </svelte:fragment>
                </SidebarList> 
            </SidebarGroup>

        {:else}
            <Spinner delay={3000}/>
        {/if}    
{/if}


    
