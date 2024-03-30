#include<stdio.h>
#include<stdlib.h>
struct node{
	int data;
	struct node*next;
}*new,*temp,*head;
int option1();
int option2();
int option3();
int option4();
int option4();
void main ()
{
 int option;
 printf("option1:create a single linked list.");
 printf("option2:add a element at start.");   
printf("option3:add a element at end.");
printf("option4:display linked list.");
printf("option5:exit.");
printf("choose  your option:");
scanf("%d",&option);
}



























int main(){
	int value;
	char ch;
	do{
	new=(struct node*)malloc(sizeof(struct node));
	printf("enter value");
	scanf("%d",&value);
	new->data=value;
	new->next=NULL;
	if(head==NULL){
		head=new;
		temp=new;
	}else{
		temp->next=new;
		temp=new;
	}
    printf("do you want to add more elementsY/N");
	scanf("%s",&ch);	
}
while(ch=='Y');
/*
temp=head;
while(temp!=NULL){
printf("%d",temp->data);
temp=temp->next;
}
*/printf("now we are adding a element in the end place");
new=(struct node*)malloc(sizeof(struct node));
printf("enter value");
scanf("%d",&value);
new->data=value;
new->next=NULL;
temp->next=new;
temp=new;
temp=head;
while(temp!=NULL){
printf("%d->",temp->data);
temp=temp->next;
}
return 0;
}