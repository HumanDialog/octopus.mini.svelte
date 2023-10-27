<script lang="ts">
    import {reef, session} from '@humandialog/auth.svelte'
    import {    Spinner, 
                Page, 
                Icon, 
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty
                } from '@humandialog/forms.svelte'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle} from 'svelte-icons/fa'

    
    export let params = {}

    let user;
    let list_component;

    let lists = [];

    const STATUS_CLOSED = 2;
    
    $: load($session);
    
    async function load(...args)
    {
        if(!$session.is_active)
        {
            user = null;
            return;
        }

        if(lists.length == 0)
        {
            let res = await reef.get('/app/Lists')
            if(res)
                lists = res.TaskList;
        }

         let res = await reef.post(`/user/query`,
                                {
                                    Id: 1,
                                    Name: "collector",
                                    ExpandLevel: 3,
                                    Tree:
                                    [
                                        {
                                            Id: 1,
                                            Association: '',
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'MyTasks',
                                                    Filter: 'Status <> STATUS_CLOSED',
                                                    Sort: "Order",
                                                    SubTree:[
                                                        {
                                                            Id: 3,
                                                            Association: 'Responsible',
                                                            Expressions:['$ref', 'Name']
                                                        },
                                                        {
                                                            Id: 4,
                                                            Association: 'OnList',
                                                            Expressions:['$ref', 'Name']
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]   
                                });
        if(res)
            user = res.User;
        else
            user = null
 
    }

    async function move_task_up(task :object)
    {
        let prev = user.MyTasks.prev(task);
        if(!prev)
            return;

        [prev.Order, task.Order] = [task.Order, prev.Order]   // swap orders
        user.MyTasks.swap(prev, task)

        list_component.refresh();

        let result = await reef.post(`${task.$ref}/MoveBefore`,
                                    {
                                        beforeTask:{
                                            $ref: prev.$ref
                                        }
                                    });
        if(result)
            task.Order = result.Task.Order
    }

    async function move_task_down(task :object)
    {
        let next = user.MyTasks.next(task);
        if(!next)
            return;

        [next.Order, task.Order] = [task.Order, next.Order];
        user.MyTasks.swap(task, next);

        list_component.refresh();

        let result = await reef.post(`${task.$ref}/MoveAfter`,
                                    {
                                        afterTask:{
                                            $ref: next.$ref
                                        }
                                    });
        if(result)
            task.Order = result.Task.Order   
    }

    async function delete_task(task)
    {
        list_component.remove(task);
        user.MyTasks.remove(task);
        
        await reef.delete(task.$ref);
    }

    async function finish_task(event, task)
    {
        task.Status = STATUS_CLOSED;
        
        event.stopPropagation();

        list_component.remove(task);
        user.MyTasks.remove(task);
        

        await reef.post(    task.$ref+'/set',
                                    {
                                        Status: STATUS_CLOSED
                                    });
    }

    async function add_task_after(title :string, after :object|null)
    {
        let new_task;
        if(after == null)
        {
            new_task = await reef.post(`/user/AddTask`,
                            {
                                title: title
                            })

            if(!new_task)
                return null;
            
            user.MyTasks = [...user.MyTasks, new_task.Task]

            return new_task.Task;
        }
        else
        {
            new_task = await reef.post(`/user/AddTaskAfter`,
                            {
                                title: title,
                                afterTask: { $ref: after.$ref }
                            })
            if(!new_task)
                return null;

            user.MyTasks = user.MyTasks.insert_after(after, new_task.Task)
            
            return new_task.Task;
        }
        
    }


    let page_operations = [
        {
            icon: FaPlus,
            caption: '',
            action: (focused) => { list_component.add(null) }
        }
    ]

    function get_add_operations(task)
    {
        return [
            {
                caption: 'Summary',
                action: (focused) =>  { list_component.edit(task, 'Summary') }
            },
            {
                caption: 'List',
                action: (focused) => { list_component.edit(task, 'OnList') }
            },
            {
                caption: 'Due Date',
                action: (focused) => { list_component.edit(task, 'DueDate') }
            },
            {
                separator: true
            },
            {
            caption: 'Task',
            columns: 2,
            action: (focused) => { list_component.add(task) }
        }

        ];
    }

    let task_operations = (task) => { 
        let add_operations = get_add_operations(task)
        return [
                {
                    icon: FaPlus,
                    caption: '',
                    grid: add_operations
                },
                {
                    caption: '',
                    icon: FaCaretUp,
                    action: (focused) => move_task_up(task)
                },
                {
                    caption: '',
                    icon: FaCaretDown,
                    action: (focused) => move_task_down(task)
                },
                {
                    caption: '',
                    icon: FaTrash,
                    action: (focused) => delete_task(task)
                }
            ];
    }

    let task_context_menu = (task) => {
        let add_operations = get_add_operations(task);
        return {
            grid: add_operations
        }
    }


</script>


{#if user}
    <Page   self={user} 
            cl="!bg-white dark:!bg-slate-900 w-full h-full flex flex-col overflow-y-hidden overflow-x-hidden py-1 px-1 border-0" 
            toolbar_operations={page_operations}
            clears_context='props sel'>

        <List   self={user} 
                a='MyTasks' 
                toolbar_operations={task_operations} 
                context_menu={task_context_menu}
                bind:this={list_component}>
            <ListTitle a='Title'/>
            <ListSummary a='Summary'/>
            <ListInserter action={add_task_after}/>

            <ListComboProperty  name="OnList" association>
                <ComboSource objects={lists} key="$ref" name='Name'/>
            </ListComboProperty>

            <ListDateProperty name="DueDate"/>

            <span slot="left" let:element>
                <Icon  size={4} 
                    component={element.Status == STATUS_CLOSED ? FaRegCheckCircle : FaRegCircle} 
                    on:click={(e) => finish_task(e, element)} 
                    class="cursor-pointer mt-1.5 ml-2 "/>
            </span>

            
        </List>

    </Page>
{:else}
    <Spinner/>
{/if}



