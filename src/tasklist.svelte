<script lang="ts">
    import {location} from 'svelte-spa-router'
    import {reef} from '@humandialog/auth.svelte'
    import {    Spinner, 
                Page, 
                Icon, 
                ComboSource,
                List,
                ListTitle,
                ListSummary,
                ListInserter,
                ListDateProperty,
                ListComboProperty} from '@humandialog/forms.svelte'
    import {FaPlus, FaCaretUp, FaCaretDown, FaTrash, FaRegCheckCircle, FaRegCircle} from 'svelte-icons/fa'

    export let params = {}

    let current_list = null;
    let list_component;

    let users = [];

    const STATUS_CLOSED = 2;
    
    $: on_params_changed($location);
    
    async function on_params_changed(...args)
    {
        const segments = $location.split('/');
        const found_idx = segments.findIndex( s => s == 'tasklist');
        if(found_idx < 0)
            return;

        if(users.length == 0)
        {
            let res = await reef.get('/app/Users')
            if(res)
                users = res.User;
        }
        
        
        let list_id = '';
        if(!segments.length)
            list_id = 'first';
        else
            list_id = segments[segments.length-1]

        current_list = null
        
        let res = await reef.post(`/app/Lists/${list_id}/query`,
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
                                                Association: 'Tasks',
                                                Filter: 'Status <> STATUS_CLOSED',
                                                Sort: 'Order',
                                                //ShowReferences: true,
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
            current_list = res.TaskList;
        else
            current_list = null

    }


    async function move_task_up(task :object)
    {
        let prev = current_list.Tasks.prev(task);
        if(!prev)
            return;

        [prev.Order, task.Order] = [task.Order, prev.Order]   // swap orders
        current_list.Tasks.swap(prev, task)

        list_component.refresh();

        let result = await reef.post(`${task.$ref}/MoveBefore`,
                                    {
                                        beforeTask: prev.$ref
                                    });
        if(result)
            task.Order = result.Task.Order
    }

    async function move_task_down(task :object)
    {
        let next = current_list.Tasks.next(task);
        if(!next)
            return;

        [next.Order, task.Order] = [task.Order, next.Order];
        current_list.Tasks.swap(task, next);

        list_component.refresh();

        let result = await reef.post(`${task.$ref}/MoveAfter`,
                                    {
                                        afterTask: next.$ref
                                    });
        if(result)
            task.Order = result.Task.Order   
    }

    async function delete_task(task)
    {
        list_component.remove(task);
        current_list.Tasks.remove(task);
        
        await reef.delete(task.$ref);
    }

    async function finish_task(event, task)
    {
        task.Status = STATUS_CLOSED;
        
        event.stopPropagation();

        list_component.remove(task);
        current_list.Tasks.remove(task);
        

        await reef.post(`${task.$ref}/set`,
                                    {
                                        Status: STATUS_CLOSED
                                    });
    }

    async function add_task_after(title :string, after :object|null)
    {
        let new_task;
        if(after == null)
        {
            new_task = await reef.post(`/app/Lists/${current_list.Id}/AddTask`,
                            {
                                title: title
                            })

            if(!new_task)
                return null;
            
            current_list.Tasks = [...current_list.Tasks, new_task.Task]

            return new_task.Task;
        }
        else
        {
            new_task = await reef.post(`/app/Lists/${current_list.Id}/AddTaskAfter`,
                            {
                                title: title,
                                afterTask: after.$ref
                            })
            if(!new_task)
                return null;

            current_list.Tasks = current_list.Tasks.insert_after(after, new_task.Task)
            
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
                caption: 'Responsible',
                action: (focused) => { list_component.edit(task, 'Responsible') }
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


{#if current_list}
    <Page   self={current_list} 
            cl="!bg-white dark:!bg-slate-900 w-full h-full flex flex-col overflow-y-hidden overflow-x-hidden py-1 px-1 border-0" 
            toolbar_operations={page_operations}
            clears_context='props sel'>

        <List   self={current_list} 
                a='Tasks' 
                title={current_list.Name} 
                toolbar_operations={task_operations} 
                context_menu={task_context_menu}
                bind:this={list_component}>
            <ListTitle a='Title'/>
            <ListSummary a='Summary'/>
            <ListInserter action={add_task_after} icon/>

            <ListComboProperty  name="Responsible" association>
                <ComboSource objects={users} key="$ref" name='Name'/>
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
    <Spinner delay={3000}/>
{/if}


