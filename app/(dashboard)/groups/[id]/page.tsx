import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getGroupById, getGroupMembers } from '@/app/actions/groups'
import { getExpensesByGroup, getGroupSettlements } from '@/app/actions/expenses'
import GroupHeader from '@/components/group-header'
import GroupMembers from '@/components/group-members'
import ExpensesList from '@/components/expenses-list'
import SettlementsList from '@/components/settlements-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const group = await getGroupById(id)
  const members = await getGroupMembers(id)
  const expenses = await getExpensesByGroup(id)
  const settlements = await getGroupSettlements(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <GroupHeader group={group} />

      {/* Content */}
      <div>
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card border border-border">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <ExpensesList groupId={id} expenses={expenses} members={members} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <GroupMembers groupId={id} members={members} />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <SettlementsList
              settlements={settlements}
              groupId={id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
