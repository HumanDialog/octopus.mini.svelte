<script>
    import {FaBars, FaUsers} from 'svelte-icons/fa'
    import MyTasks from './mytasks.svelte'
    import TaskList from './tasklist.svelte'
    import ListsNav from './navigator.svelte'  
    import {Layout} from '@humandialog/forms.svelte'
    import {reef} from '@humandialog/auth.svelte'
    import Members from './members.svelte'
    import {push} from 'svelte-spa-router'
    import AppIcon from './appicon.svelte'
    
    reef.configure( {
                    mode: 'local',
                    remote: {
                        iss :       "https://objectreef.io",
                        clientID : "minioctopus_kcdo",
                        clientSecret : "d4MYn0AG44w8xe8yr3KS3yrn638aN7oU",
                        scope :     "openid profile email octopus_kduxjvaf",
                        apiVersion: "v001"},
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        //api:    "http://192.168.0.103:1996/",
                        users:
                        [
                            "alice@example.com",
                            "bob@example.com"
                        ],
                        apiVersion: "v001"}
                   });


    const layout = {
                sidebar : {
                    'TOC': {
                        authorized :true,
                        icon: AppIcon,
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

      