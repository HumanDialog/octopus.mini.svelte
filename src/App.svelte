<script>
    import {FaBars, FaUsers} from 'svelte-icons/fa'
    import MyTasks from './mytasks.svelte'
    import TaskList from './tasklist.svelte'
    import ListsNav from './navigator.svelte'  
    import {Layout} from '@humandialog/forms.svelte'
    import {reef} from '@humandialog/auth.svelte'
    import Members from './members.svelte'
    import {push} from 'svelte-spa-router'
    
    reef.configure( {
                    mode: 'local',
                    remote: {
                        iss :       "https://objectreef.io",
                        client_id : "<YOUR_REGISTERED_CLIENT_ID>",
                        client_secret : "<YOUR_REGISTERED_CLIENT_SECRET>",
                        scope :     "openid profile email <YOUR_DEPLOYED_APP_ID>",
						api_version: "v001"},
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        users:
                        [
                            "alice@example.com",
                            "bob@example.com"
                        ],
                        api_version: "v001"}
			
                   });


    const layout = {
                sidebar : {
                    'TOC': {
                        authorized :true,
                        icon: FaBars,
                        component: ListsNav
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: MyTasks},
                        '/tasklist':    { component: TaskList},
                        '/tasklist/*':  { component: TaskList},
                        '/mytasks' :    { component: MyTasks },
                        '/mytasks/*' :  { component: MyTasks },
                        '/members'   :  { component: Members }
                    }
                },
                mainToolbar : {
                    signin: true,
                    customOperations:[
                        {
                            caption: 'Members',
                            icon: FaUsers,
                            action: (focused) => { push('/members') }
                        }
                    ]
                },
                dark:
                {
                    optional: true,
                    default: false
                },
                operations:
                {
                    optional: false,
                    default: true
                }
    }

    
</script>


<Layout {layout} />

      