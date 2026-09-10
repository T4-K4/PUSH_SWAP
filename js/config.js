const COMMANDS = [
    { cmd: 'sa', desc: "A'nın en üstteki 2 elemanını takas eder." },
    { cmd: 'sb', desc: "B'nin en üstteki 2 elemanını takas eder." },
    { cmd: 'ss', desc: "sa ve sb işlemlerini aynı anda yürütür." },
    { cmd: 'pa', desc: "B'nin en üstündeki sayıyı A'nın tepesine atar." },
    { cmd: 'pb', desc: "A'nın en üstündeki sayıyı B'nin tepesine atar." },
    { cmd: 'ra', desc: "A'yı yukarı kaydırır; tepe eleman dibe geçer." },
    { cmd: 'rb', desc: "B'yi yukarı kaydırır; tepe eleman dibe geçer." },
    { cmd: 'rr', desc: "ra ve rb işlemlerini aynı anda yürütür." },
    { cmd: 'rra', desc: "A'yı aşağı kaydırır; dip eleman tepeye gelir." },
    { cmd: 'rrb', desc: "B'yi aşağı kaydırır; dip eleman tepeye gelir." },
    { cmd: 'rrr', desc: "rra ve rrb işlemlerini aynı anda yürütür." }
];

const C_SOURCE_CODE = `#include "push_swap.h"

void\tsa(t_stack **a, int p)
{
\tt_stack\t*t;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tt = (*a)->next;
\t(*a)->next = t->next;
\tt->next = *a;
\t*a = t;
\tif (p)
\t\twrite(1, "sa\\n", 3);
}

void\tpa(t_stack **a, t_stack **b, int p)
{
\tt_stack\t*t;

\tif (!b || !*b)
\t\treturn ;
\tt = *b;
\t*b = (*b)->next;
\tt->next = *a;
\t*a = t;
\tif (p)
\t\twrite(1, "pa\\n", 3);
}

void\tpb(t_stack **a, t_stack **b, int p)
{
\tt_stack\t*t;

\tif (!a || !*a)
\t\treturn ;
\tt = *a;
\t*a = (*a)->next;
\tt->next = *b;
\t*b = t;
\tif (p)
\t\twrite(1, "pb\\n", 3);
}

void\tra(t_stack **a, int p)
{
\tt_stack\t*f;
\tt_stack\t*l;

\tif (!a || !*a || !(*a)->next)
\t\treturn ;
\tf = *a;
\t*a = f->next;
\tf->next = NULL;
\tl = *a;
\twhile (l->next)
\t\tl = l->next;
\tl->next = f;
\tif (p)
\t\twrite(1, "ra\\n", 3);
}

void\trb(t_stack **b, int p)
{
\tt_stack\t*f;
\tt_stack\t*l;

\tif (!b || !*b || !(*b)->next)
\t\treturn ;
\tf = *b;
\t*b = f->next;
\tf->next = NULL;
\tl = *b;
\twhile (l->next)
\t\tl = l->next;
\tl->next = f;
\tif (p)
\t\twrite(1, "rb\\n", 3);
}

void\trrb(t_stack **b, int p)
{
\tt_stack\t*prev;
\tt_stack\t*l;

\tif (!b || !*b || !(*b)->next)
\t\treturn ;
\tprev = NULL;
\tl = *b;
\twhile (l->next)
\t{
\t\tprev = l;
\t\tl = l->next;
\t}
\tprev->next = NULL;
\tl->next = *b;
\t*b = l;
\tif (p)
\t\twrite(1, "rrb\\n", 4);
}

void\tsort_chunks(t_stack **a, t_stack **b, int size)
{
\tint\ti;
\tint\tchunk;

\ti = 0;
\tchunk = (size <= 100) ? 15 : 32;
\twhile (*a)
\t{
\t\tif ((*a)->index <= i)
\t\t{
\t\t\tpb(a, b, 1);
\t\t\trb(b, 1);
\t\t\ti++;
\t\t}
\t\telse if ((*a)->index <= i + chunk)
\t\t{
\t\t\tpb(a, b, 1);
\t\t\ti++;
\t\t}
\t\telse
\t\t\tra(a, 1);
\t}
\twhile (*b)
\t{
\t\tb_to_a_max(a, b);
\t}
}`;
